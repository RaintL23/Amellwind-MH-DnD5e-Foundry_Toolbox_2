import type { FoundryItem } from "@/shared/foundry";
import {
  escapeHtml,
  foundryDividerHtml,
  foundryRarityTitleHtml,
  foundryActivationLeadHtml,
  foundryActivationLabelFromType,
  foundryFeatureCardHtml,
  foundryChatFeatureCardHtml,
  foundryUpgradeBlockHtml,
  formatFeatureBodyHtml,
  toFoundryDescriptionHtml,
  buildEffect,
  EFFECT_MODE,
} from "@/shared/foundry";
import {
  buildColumnChains,
  type ColumnChains,
  type FeatureUpgradeLink,
} from "@/shared/foundry/weapons";
import {
  isPrimaryFeaturesColumn,
  type CustomWeapon,
} from "../types/weapon-forge.types";
import {
  getTypedBonusValue,
  resolveFeatureDef,
} from "../utils/weapon-forge-features.utils";
import {
  parseBonusNumber,
  DEFAULT_FOUNDRY_WEAPON_IMG,
} from "./weapon-forge-foundry.helpers";
import {
  resolveCatalogIconForWeaponName,
  toFoundryImgPath,
} from "@/features/amellwind/weapons/utils/weapon-icon.utils";
import { parseFeatureUsage } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";

function activationLeadFromDescription(
  description: string | undefined,
): string {
  const usage = parseFeatureUsage(description);
  return foundryActivationLeadHtml(
    foundryActivationLabelFromType(usage.activationType),
  );
}

function featureBodyHtml(description: string | undefined): string {
  if (!description?.trim()) return "";
  const enriched = toFoundryDescriptionHtml(description, { wrapHtml: false });
  return formatFeatureBodyHtml(enriched);
}

/**
 * Full sheet block for one feature (root of a chain or standalone).
 * Kept for tests / callers that build a single block without chain context.
 */
export function appendFeatureDescription(
  parts: string[],
  name: string,
  description: string | undefined,
  nested: boolean,
  rarityLabel: string | undefined,
): void {
  const title = foundryRarityTitleHtml(name, rarityLabel);
  const lead = activationLeadFromDescription(description);
  const body = featureBodyHtml(description);
  if (nested) {
    parts.push(
      foundryUpgradeBlockHtml(
        `▸ Upgrade — ${title}`,
        `${lead}${body}`,
        rarityLabel,
      ),
    );
    return;
  }
  parts.push(`<p>${title}</p>${lead}${body}`);
}

function appendFeatureChainCard(
  parts: string[],
  weapon: CustomWeapon,
  features: NonNullable<CustomWeapon["customFeatures"]>,
  chainFeatures: { name: string; rarityIndex: number }[],
): void {
  if (chainFeatures.length === 0) return;

  const tip = chainFeatures[chainFeatures.length - 1]!;
  const tipRarity = weapon.rarityRows[tip.rarityIndex]?.rarity;
  const inner: string[] = [];

  chainFeatures.forEach((feat, fi) => {
    const def = resolveFeatureDef(features, feat.name);
    const displayName = def?.name ?? feat.name;
    const rarityLabel = weapon.rarityRows[feat.rarityIndex]?.rarity;
    const title = foundryRarityTitleHtml(displayName, rarityLabel);
    const lead = activationLeadFromDescription(def?.description);
    const body = featureBodyHtml(def?.description);

    if (fi === 0) {
      inner.push(`<p>${title}</p>${lead}${body}`);
    } else {
      inner.push(
        foundryUpgradeBlockHtml(
          `▸ Upgrade — ${title}`,
          `${lead}${body}`,
          rarityLabel,
        ),
      );
    }
  });

  parts.push(foundryFeatureCardHtml(inner.join(""), tipRarity));
}

function appendFeatureChainChatCard(
  parts: string[],
  weapon: CustomWeapon,
  features: NonNullable<CustomWeapon["customFeatures"]>,
  chainFeatures: { name: string; rarityIndex: number }[],
): void {
  if (chainFeatures.length === 0) return;

  const root = chainFeatures[0]!;
  const tip = chainFeatures[chainFeatures.length - 1]!;
  const tipRarity = weapon.rarityRows[tip.rarityIndex]?.rarity;
  const rootDef = resolveFeatureDef(features, root.name);
  const rootName = rootDef?.name ?? root.name;
  const rootRarity = weapon.rarityRows[root.rarityIndex]?.rarity;

  const inner: string[] = [
    `<p>${foundryRarityTitleHtml(rootName, rootRarity)}</p>`,
    activationLeadFromDescription(rootDef?.description),
  ];

  for (let i = 1; i < chainFeatures.length; i += 1) {
    const feat = chainFeatures[i]!;
    const def = resolveFeatureDef(features, feat.name);
    const displayName = def?.name ?? feat.name;
    const rarityLabel = weapon.rarityRows[feat.rarityIndex]?.rarity;
    inner.push(
      `<p style="margin:0.2em 0 0 0.35em">▸ ${foundryRarityTitleHtml(displayName, rarityLabel)}</p>`,
    );
  }

  parts.push(foundryChatFeatureCardHtml(inner.join(""), tipRarity));
}

export function resolveVisibleColumnChains(
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

export function appendWeaponIntroHtml(
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

export function buildFoundryDescriptionHtml(
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

  for (const { label, chains } of visibleCols) {
    parts.push(`<h3>${escapeHtml(label)}</h3>`);
    for (const chain of chains) {
      appendFeatureChainCard(parts, weapon, features, chain.features);
    }
  }

  return parts.join("");
}

/**
 * Condensed Foundry chat card: base weapon text + combat feature cards
 * (names + activation lead + upgrade names). Resource columns omitted.
 */
export function buildFoundryChatDescriptionHtml(
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

  for (const { chains } of featureCols) {
    for (const chain of chains) {
      appendFeatureChainChatCard(parts, weapon, features, chain.features);
    }
  }

  return parts.join("");
}

/** Passive AE for the weapon's integrated shield base AC (`weapon.acBonus`). */
export function buildIntegratedShieldEffect(
  weapon: CustomWeapon,
): FoundryItem["effects"][number] | null {
  const bonus = weapon.acBonus;
  if (bonus == null || !Number.isFinite(bonus) || bonus <= 0) return null;
  if (weapon.includesShield === false) return null;

  const effect = buildEffect({
    name: `Integrated Shield (+${bonus} AC)`,
    img: "icons/skills/melee/shield-block-gray-orange.webp",
    description:
      "Base AC from the weapon's integrated shield while equipped.",
    transfer: true,
    changes: [
      {
        key: "system.attributes.ac.bonus",
        mode: EFFECT_MODE.ADD,
        value: String(Math.trunc(bonus)),
        priority: 20,
      },
    ],
    flags: {
      dae: {
        stackable: "noneName",
        showIcon: true,
      },
      world: {
        integratedShield: {
          isIntegratedShield: true,
          bonus: Math.trunc(bonus),
        },
      },
    },
  });
  effect.sort = 100000;
  return effect;
}

/** Passive AE for typed AC bonuses on the selected rarity row. */
export function buildRarityPassiveEffects(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem["effects"] {
  const row = weapon.rarityRows[rarityIndex];
  if (!row) return [];
  const acBonus = parseBonusNumber(getTypedBonusValue(row, "ac"));
  if (acBonus <= 0) return [];
  return [
    buildEffect({
      name: `${weapon.name} AC (+${acBonus})`,
      img: "icons/skills/melee/shield-block-gray-orange.webp",
      description: `${row.rarity} ${weapon.name} bonus AC from the rarity table.`,
      transfer: true,
      changes: [
        {
          key: "system.attributes.ac.bonus",
          mode: EFFECT_MODE.ADD,
          value: String(acBonus),
          priority: 20,
        },
      ],
      flags: {
        dae: {
          stackable: "noneName",
          showIcon: true,
        },
      },
    }),
  ];
}

export function resolveWeaponImg(weapon: CustomWeapon): string {
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
