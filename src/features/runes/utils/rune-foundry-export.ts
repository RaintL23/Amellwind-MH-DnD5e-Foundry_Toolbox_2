import type { Rune } from "@/shared/types";
import {
  foundryId,
  wrapItem,
  slugify,
  mapRarity,
  mapDamageType,
  escapeHtml,
  toFoundryDescriptionHtml,
  defaultMidiProperties,
  buildEffect,
  EFFECT_MODE,
  downloadFoundryJson,
  FOUNDRY_EXPORT_TARGET,
  type FoundryActiveEffect,
  type FoundryItem,
  buildFoundryItemFilename,
} from "@/shared/foundry";
import { UNKNOWN_MATERIAL_EFFECT_TIER } from "@/features/material-effects/constants/material-effect.constants";
import {
  getMaterialEffectNameIndex,
  type MaterialEffectNameIndex,
} from "@/features/material-effects/services/material-effect.service";
import { getMaterialEffectTierForText } from "@/features/material-effects/utils/material-effect-highlight.utils";

export type RuneSlotContext = "Weapon" | "Armor" | "Trinket";

function resolveRuneMaterialEffectRarity(
  rune: Rune,
  slotContext: RuneSlotContext,
  index: MaterialEffectNameIndex,
): string {
  if (slotContext === "Weapon") {
    return getMaterialEffectTierForText(
      rune.weaponEffect ?? "",
      "weapon",
      index,
    );
  }
  if (slotContext === "Armor") {
    return getMaterialEffectTierForText(rune.armorEffect ?? "", "armor", index);
  }

  const weaponTier = getMaterialEffectTierForText(
    rune.weaponEffect ?? "",
    "weapon",
    index,
  );
  if (weaponTier !== UNKNOWN_MATERIAL_EFFECT_TIER) return weaponTier;

  return getMaterialEffectTierForText(rune.armorEffect ?? "", "armor", index);
}

function effectTextForContext(
  rune: Rune,
  slotContext: RuneSlotContext,
): string {
  if (slotContext === "Weapon") return rune.weaponEffect ?? "";
  if (slotContext === "Armor") return rune.armorEffect ?? "";
  return [rune.weaponEffect, rune.armorEffect].filter(Boolean).join("\n\n");
}

/**
 * Best-effort Active Effects from material-effect prose (AC bonus, damage
 * resistance keywords, flat damage bonuses). Narrative-only text yields [].
 */
export function buildRunePassiveEffects(
  rune: Rune,
  slotContext: RuneSlotContext,
): FoundryActiveEffect[] {
  const text = effectTextForContext(rune, slotContext);
  if (!text.trim()) return [];

  const effects: FoundryActiveEffect[] = [];
  const acMatch = text.match(/\+(\d+)\s*(?:to\s+)?(?:AC|Armor Class)\b/i);
  if (acMatch) {
    effects.push(
      buildEffect({
        name: `${rune.name} Rune AC`,
        transfer: true,
        changes: [
          {
            key: "system.attributes.ac.bonus",
            mode: EFFECT_MODE.ADD,
            value: acMatch[1],
            priority: 20,
          },
        ],
      }),
    );
  }

  const resistMatch = text.match(
    /resistance to ([\w\s,]+?)(?:\.|,|;|$)/i,
  );
  if (resistMatch) {
    const types = resistMatch[1]
      .split(/,| and /i)
      .map((t) => mapDamageType(t.trim()))
      .filter((t): t is string => !!t);
    if (types.length > 0) {
      effects.push(
        buildEffect({
          name: `${rune.name} Rune Resistance`,
          transfer: true,
          changes: types.map((type) => ({
            key: `system.traits.dr.value`,
            mode: EFFECT_MODE.ADD,
            value: type,
            priority: 20,
          })),
        }),
      );
    }
  }

  const dmgBonus = text.match(
    /\+(\d+d\d+(?:\s*[+-]\s*\d+)?|\d+)\s+(\w+)\s+damage/i,
  );
  if (dmgBonus && slotContext !== "Armor") {
    const formula = dmgBonus[1].includes("d")
      ? dmgBonus[1]
      : dmgBonus[1];
    const dtype = mapDamageType(dmgBonus[2]);
    effects.push(
      buildEffect({
        name: `${rune.name} Rune Damage`,
        transfer: true,
        changes: [
          {
            key: "system.bonuses.mwak.damage",
            mode: EFFECT_MODE.ADD,
            value: dtype ? `+ ${formula}[${dtype}]` : `+ ${formula}`,
            priority: 20,
          },
          {
            key: "system.bonuses.rwak.damage",
            mode: EFFECT_MODE.ADD,
            value: dtype ? `+ ${formula}[${dtype}]` : `+ ${formula}`,
            priority: 20,
          },
        ],
      }),
    );
  }

  return effects;
}

function buildRuneDescription(
  rune: Rune,
  slotContext: RuneSlotContext,
): string {
  const parts: string[] = [];

  parts.push(`<h4>Source Monster</h4>`);
  parts.push(
    `<p><strong>Monster:</strong> ${escapeHtml(rune.monsterName)} | CR: ${escapeHtml(String(rune.monsterCr))} | Tier: ${escapeHtml(String(rune.tier))}</p>`,
  );

  const slotsLabel = rune.slots
    .map((s) => (s === "W" ? "Weapon" : "Armor"))
    .join(", ");
  parts.push(
    `<p><strong>Compatible Slots:</strong> ${escapeHtml(slotsLabel)}</p>`,
  );

  if (slotContext === "Weapon") {
    if (rune.weaponEffect) {
      parts.push(`<h3>Weapon Effect</h3>`);
      parts.push(toFoundryDescriptionHtml(rune.weaponEffect));
    }
  } else if (slotContext === "Armor") {
    if (rune.armorEffect) {
      parts.push(`<h3>Armor Effect</h3>`);
      parts.push(toFoundryDescriptionHtml(rune.armorEffect));
    }
  } else {
    if (rune.weaponEffect) {
      parts.push(`<h3>Weapon Effect</h3>`);
      parts.push(toFoundryDescriptionHtml(rune.weaponEffect));
    }
    if (rune.armorEffect) {
      parts.push(`<h3>Armor Effect</h3>`);
      parts.push(toFoundryDescriptionHtml(rune.armorEffect));
    }
  }

  if (rune.tags.length > 0) {
    parts.push(
      `<p><em><strong>Tags:</strong> ${escapeHtml(rune.tags.join(", "))}</em></p>`,
    );
  }

  return parts.join("\n");
}

/** True when effect text implies an activatable (action / once per) use. */
function runeNeedsUtilityActivity(text: string): boolean {
  return (
    /\b(as an action|bonus action|reaction|once per|you can use)\b/i.test(
      text,
    )
  );
}

export function buildRuneFoundryItem(
  rune: Rune,
  slotContext: RuneSlotContext,
  materialEffectIndex?: MaterialEffectNameIndex | null,
): FoundryItem {
  const itemName = `${rune.name} Rune (${slotContext})`;
  const materialRarity = materialEffectIndex
    ? resolveRuneMaterialEffectRarity(rune, slotContext, materialEffectIndex)
    : "";

  const effectText = effectTextForContext(rune, slotContext);
  const effects = buildRunePassiveEffects(rune, slotContext);
  const activities: Record<string, unknown> = {};

  if (runeNeedsUtilityActivity(effectText)) {
    const id = foundryId();
    activities[id] = {
      _id: id,
      type: "utility",
      sort: 0,
      name: itemName,
      activation: { type: "action", value: 1, override: false },
      consumption: {
        scaling: { allowed: false },
        spellSlot: false,
        targets: [],
      },
      description: { chatFlavor: "" },
      duration: { units: "inst", concentration: false, override: false },
      effects: [],
      range: { units: "self", override: false },
      target: {
        template: { contiguous: false, units: "ft" },
        affects: { choice: false },
        override: false,
        prompt: false,
      },
      uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
      roll: { formula: "", name: "", prompt: false, visible: false },
      midiProperties: defaultMidiProperties({
        identifier: slugify(itemName),
      }),
    };
  }

  const system: Record<string, unknown> = {
    source: {
      custom: "",
      book: rune.monsterSource ?? "",
      page: "",
      license: "",
      rules: FOUNDRY_EXPORT_TARGET.rules,
      revision: 1,
    },
    description: {
      value: buildRuneDescription(rune, slotContext),
      chat: "",
    },
    identifier: slugify(itemName),
    quantity: 1,
    weight: { value: 0.1, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: false,
    rarity: mapRarity(
      materialRarity === UNKNOWN_MATERIAL_EFFECT_TIER
        ? undefined
        : materialRarity,
    ),
    identified: true,
    type: { value: "trinket", baseItem: "" },
    armor: { value: null, dex: null, magicalBonus: null },
    properties: [],
    proficient: null,
    strength: null,
    activities,
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
    uses: { spent: 0, max: "", recovery: [] },
  };

  return wrapItem({
    name: itemName,
    type: "equipment",
    img: "mh-icons/material-rune.webp",
    system,
    effects,
    flags: {
      "amellwind-toolbox": {
        exportKind: "rune",
        runeName: rune.name,
        slotContext,
        monsterName: rune.monsterName,
      },
    },
  });
}

function triggerJsonDownload(item: FoundryItem, filename: string): void {
  downloadFoundryJson(item, filename);
}

export async function downloadAllBuildRuneJsons(
  weaponRunes: (Rune | null)[],
  armorRunes: (Rune | null)[],
  trinket1Rune: Rune | null,
  trinket2Rune: Rune | null,
): Promise<void> {
  const materialEffectIndex = await getMaterialEffectNameIndex();

  const entries: { rune: Rune; slotContext: RuneSlotContext }[] = [
    ...weaponRunes
      .filter((r): r is Rune => r !== null)
      .map((r) => ({ rune: r, slotContext: "Weapon" as RuneSlotContext })),
    ...armorRunes
      .filter((r): r is Rune => r !== null)
      .map((r) => ({ rune: r, slotContext: "Armor" as RuneSlotContext })),
    ...(trinket1Rune
      ? [{ rune: trinket1Rune, slotContext: "Trinket" as RuneSlotContext }]
      : []),
    ...(trinket2Rune
      ? [{ rune: trinket2Rune, slotContext: "Trinket" as RuneSlotContext }]
      : []),
  ];

  entries.forEach(({ rune, slotContext }, index) => {
    const item = buildRuneFoundryItem(rune, slotContext, materialEffectIndex);
    const filename = buildFoundryItemFilename(
      rune.monsterName,
      rune.name,
      "rune",
      slotContext,
    );
    setTimeout(() => triggerJsonDownload(item, filename), index * 150);
  });
}
