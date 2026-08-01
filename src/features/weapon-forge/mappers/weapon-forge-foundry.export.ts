import type { Weapon } from "@/shared/types";
import { isBaseRarity } from "@/shared/types";
import { makeWeaponSlot } from "@/features/builder/utils/equipment.factory";
import { buildWeaponItem } from "@/features/builder/foundry-export/item.builders";
import { applyItemAutomation } from "@/features/builder/foundry-export/automation.builders";
import { foundryId } from "@/features/builder/foundry-export/foundry-id.utils";
import { mapDamageType } from "@/features/builder/foundry-export/mappings";
import type { FoundryItem } from "@/features/builder/foundry-export/foundry.types";
import {
  escapeHtml,
  foundryDividerHtml,
  foundryRarityTitleHtml,
  toFoundryDescriptionHtml,
} from "@/features/builder/foundry-export/description.enrichers";
import { defaultMidiProperties } from "@/features/builder/foundry-export/midi.utils";
import { buildEffect, EFFECT_MODE } from "@/features/builder/foundry-export/effect.builders";
import {
  resolveCatalogIconForWeaponName,
  toFoundryImgPath,
} from "@/features/weapons/utils/weapon-icon.utils";
import {
  hasWeaponSwitchModes,
  resolveGripModeDamage,
  resolveWeaponModeDefs,
  type WeaponGripMode,
} from "@/features/weapons/utils/weapon-mode.utils";
import {
  buildColumnChains,
  type ColumnChains,
  type FeatureUpgradeLink,
} from "@/features/weapons/utils/weapon-feature-chains.utils";
import {
  isPrimaryFeaturesColumn,
  type CustomWeapon,
} from "../types/weapon-forge.types";
import {
  getTypedBonusValue,
  resolveFeatureDef,
} from "../utils/weapon-forge-features.utils";

const DEFAULT_FOUNDRY_WEAPON_IMG =
  "icons/weapons/swords/sword-broad-steel.webp";

function parseBonusNumber(raw: string): number {
  const match = raw.trim().match(/([+-]?\d+)/);
  if (!match) return 0;
  return Math.abs(Number.parseInt(match[1], 10)) || 0;
}

function parseDice(
  formula: string,
): { number: number; denomination: number } | null {
  const match = formula.match(/(\d+)\s*d\s*(\d+)/i);
  if (!match) return null;
  return { number: Number(match[1]), denomination: Number(match[2]) };
}

function slugifyIdentifier(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveMagicalBonus(
  weapon: CustomWeapon,
  rarityIndex: number,
): number {
  const row = weapon.rarityRows[rarityIndex];
  if (!row || isBaseRarity(row.rarity)) return 0;
  const toHit = parseBonusNumber(getTypedBonusValue(row, "toHit"));
  const damage = parseBonusNumber(getTypedBonusValue(row, "damage"));
  return Math.max(toHit, damage);
}

function isRangedWeapon(weapon: Weapon): boolean {
  if (weapon.properties.some((p) => p.split("|")[0] === "A")) return true;
  if (weapon.ammoType) return true;
  return false;
}

function emptyDamageField(): Record<string, unknown> {
  return {
    number: null,
    denomination: null,
    types: [],
    custom: { enabled: false },
    scaling: { number: 1 },
  };
}

function damageFieldFromFormula(
  formula: string,
  dmgType: string | undefined,
): Record<string, unknown> {
  const dice = parseDice(formula) ?? { number: 1, denomination: 4 };
  const mapped = mapDamageType(dmgType);
  return {
    number: dice.number,
    denomination: dice.denomination,
    types: mapped ? [mapped] : [],
    custom: { enabled: false },
    scaling: { mode: "", number: 1 },
    bonus: "",
  };
}

function buildAttackActivityBase(opts: {
  id: string;
  name: string;
  sort: number;
  ranged: boolean;
  includeBase: boolean;
  parts: Record<string, unknown>[];
  midi: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    _id: opts.id,
    type: "attack",
    sort: opts.sort,
    name: opts.name,
    activation: { type: "action", value: 1, override: false },
    consumption: {
      scaling: { allowed: false },
      spellSlot: true,
      targets: [],
    },
    description: {},
    duration: { units: "inst", concentration: false, override: false },
    effects: [],
    range: { units: "self", override: false },
    target: {
      template: { contiguous: false, units: "ft" },
      affects: { choice: false },
      override: false,
      prompt: true,
    },
    uses: { spent: 0, recovery: [] },
    attack: {
      ability: "",
      type: {
        value: opts.ranged ? "ranged" : "melee",
        classification: "weapon",
      },
      critical: { threshold: null },
      flat: false,
      bonus: "",
    },
    damage: {
      critical: { bonus: "" },
      includeBase: opts.includeBase,
      parts: opts.parts,
    },
    midiProperties: opts.midi,
  };
}

function appendFeatureDescription(
  parts: string[],
  name: string,
  description: string | undefined,
  nested: boolean,
  rarityLabel: string | undefined,
): void {
  if (nested) parts.push("<blockquote>");
  parts.push(`<p>${foundryRarityTitleHtml(name, rarityLabel)}</p>`);
  if (description?.trim()) {
    const enriched = toFoundryDescriptionHtml(description, { wrapHtml: false });
    for (const para of enriched.split(/\n\s*\n/)) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("<")) {
        parts.push(trimmed);
      } else {
        parts.push(`<p>${trimmed.replace(/\n/g, "<br/>")}</p>`);
      }
    }
  }
  if (nested) parts.push("</blockquote>");
}

function resolveVisibleColumnChains(
  weapon: CustomWeapon,
  rarityIndex: number,
): ColumnChains[] {
  const features = weapon.customFeatures ?? [];
  const upgradeLinks: FeatureUpgradeLink[] = features.map((f) => ({
    id: f.id,
    name: f.name,
    upgradesFromId: f.upgradesFromId,
  }));

  const columnChains = buildColumnChains(weapon.rarityRows, {
    upgradeLinks: upgradeLinks.length > 0 ? upgradeLinks : undefined,
  });

  return columnChains
    .map(({ label, chains }) => ({
      label,
      chains: chains
        .filter((c) => c.introducedAtIndex <= rarityIndex)
        .map((chain) => ({
          ...chain,
          features: chain.features.filter((f) => f.rarityIndex <= rarityIndex),
        }))
        .filter((c) => c.features.length > 0),
    }))
    .filter(({ chains }) => chains.length > 0);
}

function appendWeaponIntroHtml(
  parts: string[],
  weapon: CustomWeapon,
  options: { includeFiveToolsLink: boolean },
): void {
  if (weapon.description.trim()) {
    parts.push(
      toFoundryDescriptionHtml(weapon.description.trim(), {
        fiveToolsItemName: options.includeFiveToolsLink
          ? weapon.name
          : undefined,
        fiveToolsLinkLabel: options.includeFiveToolsLink
          ? `Open ${weapon.name} filters on 5e.tools`
          : undefined,
      }),
    );
  }
  for (const note of weapon.supplementaryNotes) {
    if (note.trim()) {
      parts.push(toFoundryDescriptionHtml(note.trim()));
    }
  }
}

function buildFoundryDescriptionHtml(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const parts: string[] = [];
  appendWeaponIntroHtml(parts, weapon, { includeFiveToolsLink: true });

  const features = weapon.customFeatures ?? [];
  const visibleCols = resolveVisibleColumnChains(weapon, rarityIndex);
  if (visibleCols.length === 0) return parts.join("");

  if (parts.length > 0) {
    parts.push(foundryDividerHtml());
  }

  let featureBlockIndex = 0;
  for (const { label, chains } of visibleCols) {
    parts.push(`<h3>${escapeHtml(label)}</h3>`);
    for (const chain of chains) {
      if (featureBlockIndex > 0) {
        parts.push(foundryDividerHtml());
      }
      featureBlockIndex += 1;
      chain.features.forEach((feat, fi) => {
        const def = resolveFeatureDef(features, feat.name);
        const displayName = def?.name ?? feat.name;
        const rarityLabel = weapon.rarityRows[feat.rarityIndex]?.rarity;
        appendFeatureDescription(
          parts,
          displayName,
          def?.description,
          fi > 0,
          rarityLabel,
        );
      });
    }
  }

  return parts.join("");
}

/**
 * Condensed Foundry chat card: base weapon text + combat feature names
 * (with upgrades). Resource columns (Phials, Coatings, …) are omitted.
 */
function buildFoundryChatDescriptionHtml(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const parts: string[] = [];
  appendWeaponIntroHtml(parts, weapon, { includeFiveToolsLink: false });

  const features = weapon.customFeatures ?? [];
  const featureCols = resolveVisibleColumnChains(weapon, rarityIndex).filter(
    ({ label }) => isPrimaryFeaturesColumn(label),
  );
  if (featureCols.length === 0) return parts.join("");

  if (parts.length > 0) {
    parts.push(foundryDividerHtml());
  }

  let featureBlockIndex = 0;
  for (const { chains } of featureCols) {
    for (const chain of chains) {
      if (featureBlockIndex > 0) {
        parts.push(foundryDividerHtml());
      }
      featureBlockIndex += 1;
      chain.features.forEach((feat, fi) => {
        const def = resolveFeatureDef(features, feat.name);
        const displayName = def?.name ?? feat.name;
        const rarityLabel = weapon.rarityRows[feat.rarityIndex]?.rarity;
        const title = foundryRarityTitleHtml(displayName, rarityLabel);
        if (fi === 0) {
          parts.push(`<p>${title}</p>`);
        } else {
          parts.push(`<blockquote><p>${title}</p></blockquote>`);
        }
      });
    }
  }

  return parts.join("");
}

/** Passive AE for typed AC bonuses on the selected rarity row. */
function buildRarityPassiveEffects(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem["effects"] {
  const row = weapon.rarityRows[rarityIndex];
  if (!row) return [];
  const acBonus = parseBonusNumber(getTypedBonusValue(row, "ac"));
  if (acBonus <= 0) return [];
  return [
    buildEffect({
      name: `${weapon.name} AC`,
      transfer: true,
      changes: [
        {
          key: "system.attributes.ac.bonus",
          mode: EFFECT_MODE.ADD,
          value: String(acBonus),
          priority: 20,
        },
      ],
    }),
  ];
}

function resolveWeaponImg(weapon: CustomWeapon): string {
  const explicit = weapon.img?.trim();
  if (explicit) {
    return toFoundryImgPath(explicit) ?? DEFAULT_FOUNDRY_WEAPON_IMG;
  }
  const catalog = resolveCatalogIconForWeaponName(weapon.name);
  if (catalog) {
    return toFoundryImgPath(catalog) ?? DEFAULT_FOUNDRY_WEAPON_IMG;
  }
  return DEFAULT_FOUNDRY_WEAPON_IMG;
}

function applySwitchModeActivities(
  item: FoundryItem,
  weapon: CustomWeapon,
  magical: boolean,
): void {
  if (!hasWeaponSwitchModes(weapon)) return;

  const defs = resolveWeaponModeDefs(weapon);
  if (!defs || defs.length < 2) return;

  const modes: WeaponGripMode[] = defs.map((def, index) => {
    const damageKey: "dmg1" | "dmg2" | undefined =
      index === 0 ? "dmg1" : index === 1 ? "dmg2" : undefined;
    return {
      label: def.label,
      damage: def.damage.trim() || weapon.dmg1,
      damageKey,
      dmgType: def.dmgType?.trim() || weapon.dmgType,
      hasShield: def.hasShield === true,
      isTwoHanded: def.isTwoHanded === true,
      blocksOffHand: def.blocksOffHand === true,
    };
  });

  const system = item.system as Record<string, unknown>;
  const ranged = isRangedWeapon(weapon);
  const primary = modes[0];
  const primaryFormula = resolveGripModeDamage(weapon, primary);

  system.damage = {
    base: damageFieldFromFormula(primaryFormula, primary.dmgType),
    versatile: emptyDamageField(),
  };

  const activities: Record<string, unknown> = {};
  modes.forEach((mode, index) => {
    const id = foundryId();
    const formula = resolveGripModeDamage(weapon, mode);
    const isPrimary = index === 0;
    activities[id] = buildAttackActivityBase({
      id,
      name: mode.label,
      sort: index * 100000,
      ranged,
      includeBase: isPrimary,
      parts: isPrimary
        ? []
        : [damageFieldFromFormula(formula, mode.dmgType)],
      midi: defaultMidiProperties({
        displayActivityName: true,
        identifier: slugifyIdentifier(mode.label),
        magicDamage: magical,
        magicEffect: magical,
      }),
    });
  });

  system.activities = activities;
}

function applyMidiToExistingActivities(
  item: FoundryItem,
  opts: { magical: boolean; multiMode: boolean },
): void {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return;

  for (const activity of Object.values(
    activities as Record<string, Record<string, unknown>>,
  )) {
    if (!activity || typeof activity !== "object") continue;
    const name =
      typeof activity.name === "string" ? activity.name.trim() : "";
    activity.midiProperties = defaultMidiProperties({
      displayActivityName: opts.multiMode && !!name,
      identifier: name ? slugifyIdentifier(name) : "",
      magicDamage: opts.magical,
      magicEffect: opts.magical,
    });
  }
}

/**
 * Builds a standalone Foundry dnd5e Item (`type: "weapon"`) for the selected rarity.
 */
export function buildWeaponFoundryItem(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem {
  const clamped = Math.max(
    0,
    Math.min(rarityIndex, Math.max(0, weapon.rarityRows.length - 1)),
  );
  const row = weapon.rarityRows[clamped];
  const rarityLabel = row?.rarity ?? "Common";
  const magicalBonus = resolveMagicalBonus(weapon, clamped);

  const weaponCategory: Weapon["weaponCategory"] =
    weapon.proficiency?.tier === "simple"
      ? "simple"
      : weapon.proficiency?.tier === "martial" ||
          weapon.proficiency?.tier === "martial-or-simple"
        ? "martial"
        : "martial";

  const exportWeapon: Weapon = {
    ...weapon,
    weaponCategory,
    baseName: weapon.name,
    itemRarityLabel: isBaseRarity(rarityLabel) ? undefined : rarityLabel,
    name:
      magicalBonus > 0 && !/^\+\d+\s/.test(weapon.name)
        ? `+${magicalBonus} ${weapon.name}`
        : weapon.name,
  };

  const equipped = makeWeaponSlot(exportWeapon, rarityLabel);
  const item = buildWeaponItem(equipped, {
    equipped: false,
    description: buildFoundryDescriptionHtml(weapon, clamped),
    chatDescription: buildFoundryChatDescriptionHtml(weapon, clamped),
  });

  item.img = resolveWeaponImg(weapon);

  const system = item.system as Record<string, unknown>;
  let magical = magicalBonus > 0;

  if (row && !isBaseRarity(row.rarity)) {
    system.rarity = mapRarityLabel(row.rarity);
    if (magicalBonus > 0) {
      system.magicalBonus = magicalBonus;
      const props = Array.isArray(system.properties)
        ? [...(system.properties as string[])]
        : [];
      if (!props.includes("mgc")) props.push("mgc");
      system.properties = props;
      magical = true;
    }
  }

  const props = Array.isArray(system.properties)
    ? (system.properties as string[])
    : [];
  if (props.includes("mgc")) magical = true;

  const multiMode = hasWeaponSwitchModes(weapon);
  if (multiMode) {
    applySwitchModeActivities(item, weapon, magical);
  } else {
    applyMidiToExistingActivities(item, { magical, multiMode: false });
  }

  applyItemAutomation(item);

  const passiveEffects = buildRarityPassiveEffects(weapon, clamped);
  if (passiveEffects.length > 0) {
    item.effects.push(...passiveEffects);
  }

  // Canonical English name helps Automated Animations / CPR name matching.
  item.flags = {
    ...item.flags,
    "amellwind-toolbox": {
      ...(typeof item.flags["amellwind-toolbox"] === "object" &&
      item.flags["amellwind-toolbox"] !== null
        ? (item.flags["amellwind-toolbox"] as Record<string, unknown>)
        : {}),
      baseWeaponName: weapon.name,
      exportKind: "weapon-forge",
    },
  };

  return item;
}

function mapRarityLabel(label: string): string {
  switch (label.trim().toLowerCase()) {
    case "common":
      return "common";
    case "uncommon":
      return "uncommon";
    case "rare":
      return "rare";
    case "very rare":
      return "veryRare";
    case "legendary":
      return "legendary";
    default:
      return "";
  }
}

export function foundryItemFilename(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const rarity = weapon.rarityRows[rarityIndex]?.rarity ?? "item";
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `fvtt-Item-${slug(weapon.name) || "weapon"}-${slug(rarity) || "item"}.json`;
}
