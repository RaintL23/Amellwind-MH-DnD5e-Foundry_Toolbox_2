import type { Rune } from "@/shared/types";
import {
  wrapItem,
  slugify,
  mapRarity,
  escapeHtml,
  toFoundryDescriptionHtml,
  downloadFoundryJson,
  FOUNDRY_EXPORT_TARGET,
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
      rune.weaponTags,
    );
  }
  if (slotContext === "Armor") {
    return getMaterialEffectTierForText(
      rune.armorEffect ?? "",
      "armor",
      index,
      rune.armorTags,
    );
  }

  const weaponTier = getMaterialEffectTierForText(
    rune.weaponEffect ?? "",
    "weapon",
    index,
    rune.weaponTags,
  );
  if (weaponTier !== UNKNOWN_MATERIAL_EFFECT_TIER) return weaponTier;

  return getMaterialEffectTierForText(
    rune.armorEffect ?? "",
    "armor",
    index,
    rune.armorTags,
  );
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

/**
 * Description-only Foundry equipment item for a rune.
 * No activities or Active Effects — curated automations live in
 * `public/data/foundry-jsons-example/runes`.
 */
export function buildRuneFoundryItem(
  rune: Rune,
  slotContext: RuneSlotContext,
  materialEffectIndex?: MaterialEffectNameIndex | null,
): FoundryItem {
  const itemName = `${rune.name} Rune (${slotContext})`;
  const materialRarity = materialEffectIndex
    ? resolveRuneMaterialEffectRarity(rune, slotContext, materialEffectIndex)
    : "";

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
    activities: {},
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
    effects: [],
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
