import type { Rune } from "@/shared/types";
import {
  foundryId,
  buildStats,
  DEFAULT_OWNERSHIP,
} from "@/features/builder/foundry-export/foundry-id.utils";
import {
  slugify,
  kebab,
  mapRarity,
} from "@/features/builder/foundry-export/mappings";
import type { FoundryItem } from "@/features/builder/foundry-export/foundry.types";
import { UNKNOWN_MATERIAL_EFFECT_TIER } from "@/features/material-effects/constants/material-effect.constants";
import {
  getMaterialEffectNameIndex,
  type MaterialEffectNameIndex,
} from "@/features/material-effects/services/material-effect.service";
import { getMaterialEffectTierForText } from "@/features/material-effects/utils/material-effect-highlight.utils";

export type RuneSlotContext = "Weapon" | "Armor" | "Trinket";

let _itemSort = 0;

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

function buildRuneDescription(
  rune: Rune,
  slotContext: RuneSlotContext,
): string {
  const parts: string[] = [];

  parts.push(`<h4>Source Monster</h4>`);
  parts.push(
    `<p><strong>Monster:</strong> ${rune.monsterName} | CR: ${rune.monsterCr} | Tier: ${rune.tier}</p>`,
  );

  const slotsLabel = rune.slots
    .map((s) => (s === "W" ? "Weapon" : "Armor"))
    .join(", ");
  parts.push(`<p><strong>Compatible Slots:</strong> ${slotsLabel}</p>`);

  if (slotContext === "Weapon") {
    if (rune.weaponEffect) {
      parts.push(`<h3>Weapon Effect</h3>`);
      parts.push(`<p>${rune.weaponEffect}</p>`);
    }
  } else if (slotContext === "Armor") {
    if (rune.armorEffect) {
      parts.push(`<h3>Armor Effect</h3>`);
      parts.push(`<p>${rune.armorEffect}</p>`);
    }
  } else {
    // Trinket — show both available effects
    if (rune.weaponEffect) {
      parts.push(`<h3>Weapon Effect</h3>`);
      parts.push(`<p>${rune.weaponEffect}</p>`);
    }
    if (rune.armorEffect) {
      parts.push(`<h3>Armor Effect</h3>`);
      parts.push(`<p>${rune.armorEffect}</p>`);
    }
  }

  if (rune.tags.length > 0) {
    parts.push(
      `<p><em><strong>Tags:</strong> ${rune.tags.join(", ")}</em></p>`,
    );
  }

  return parts.join("\n");
}

export function buildRuneFoundryItem(
  rune: Rune,
  slotContext: RuneSlotContext,
  materialEffectIndex?: MaterialEffectNameIndex | null,
): FoundryItem {
  const itemName = `${rune.name} Rune (${slotContext})`;
  _itemSort += 100000;

  const materialRarity = materialEffectIndex
    ? resolveRuneMaterialEffectRarity(rune, slotContext, materialEffectIndex)
    : "";

  const system: Record<string, unknown> = {
    source: {
      custom: "",
      book: rune.monsterSource ?? "",
      page: "",
      license: "",
      rules: "2024",
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

  return {
    _id: foundryId(),
    name: itemName,
    type: "equipment",
    img: "mh-icons/material-rune.png",
    system,
    effects: [],
    folder: null,
    sort: _itemSort,
    ownership: { ...DEFAULT_OWNERSHIP },
    flags: {},
    _stats: buildStats(),
  };
}

function triggerJsonDownload(item: FoundryItem, filename: string): void {
  const json = JSON.stringify(item, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    const filename = `${kebab(rune.monsterName)}-${kebab(rune.name)}-rune-${slotContext.toLowerCase()}.json`;
    // Stagger downloads slightly so browsers don't block them
    setTimeout(() => triggerJsonDownload(item, filename), index * 150);
  });
}
