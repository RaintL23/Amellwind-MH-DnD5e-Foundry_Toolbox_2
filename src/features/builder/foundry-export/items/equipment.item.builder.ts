import type { FoundryItem } from "@/shared/foundry";
import {
  wrapItem,
  mapArmorTypeValue,
  mapRarity,
  slugify,
  FOUNDRY_ITEM_ICONS,
} from "@/shared/foundry";
import type { ArmorItem } from "@/shared/types";
import { sourceBlock, htmlDesc, parseMagicBonus } from "./item-shared";

// ─── Armor / shield / trinket equipment items ────────────────────────────────

export function buildArmorItem(
  armor: ArmorItem,
  equipped: boolean,
  description?: string,
  img?: string,
): FoundryItem {
  const { bonus: magicBonus } = parseMagicBonus(armor.name);
  const isShield = armor.category === "shield";
  const properties: string[] = [];
  if (magicBonus > 0) properties.push("mgc");
  if (armor.stealthDisadvantage) properties.push("stealthDisadvantage");

  const system: Record<string, unknown> = {
    source: sourceBlock(armor.source),
    description: htmlDesc(description ?? armor.description),
    identifier: slugify(armor.name),
    quantity: 1,
    weight: { value: armor.weight ?? 0, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped,
    rarity: mapRarity(armor.itemRarityLabel),
    identified: true,
    type: {
      value: mapArmorTypeValue(armor.category),
      baseItem: slugify(armor.baseName ?? armor.name),
    },
    armor: {
      value: armor.baseAC,
      magicalBonus: magicBonus || null,
      dex: isShield ? null : armor.maxDexBonus,
    },
    properties,
    proficient: null,
    strength: null,
    uses: { spent: 0, max: "", recovery: [] },
    activities: {},
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
  };

  const fallbackImg = isShield
    ? FOUNDRY_ITEM_ICONS.shield
    : FOUNDRY_ITEM_ICONS.armor;
  return wrapItem({
    name: armor.name,
    type: "equipment",
    img: img ?? fallbackImg,
    system,
  });
}

export function buildTrinketItem(
  name: string,
  description?: string,
  img?: string,
): FoundryItem {
  const system: Record<string, unknown> = {
    source: sourceBlock(undefined),
    description: htmlDesc(description),
    identifier: slugify(name),
    quantity: 1,
    weight: { value: 0, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: true,
    rarity: "",
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
  };
  return wrapItem({
    name,
    type: "equipment",
    img: img ?? FOUNDRY_ITEM_ICONS.trinket,
    system,
  });
}

