import type { ArmorItem } from "@/shared/types";

/** D&D 5e standalone shield (PHB / items catalog). */
export interface StandaloneShieldItem {
  name: string;
  acBonus: number;
  weight: number;
  rarity: string;
}

export const STANDALONE_SHIELD: StandaloneShieldItem = {
  name: "Shield",
  acBonus: 2,
  weight: 6,
  rarity: "Common",
};

export function isStandaloneShieldName(name: string): boolean {
  return name.trim().toLowerCase() === "shield";
}

export function findShieldByCartName(name: string): StandaloneShieldItem | null {
  return isStandaloneShieldName(name) ? STANDALONE_SHIELD : null;
}

export function isShieldArmorItem(armor: ArmorItem): boolean {
  return armor.category === "shield" || isStandaloneShieldName(armor.name);
}

export function armorItemToStandaloneShield(armor: ArmorItem): StandaloneShieldItem {
  return {
    name: armor.name,
    acBonus: armor.baseAC,
    weight: armor.weight,
    rarity: armor.itemRarityLabel ?? armor.rarity,
  };
}

export function standaloneShieldToArmorItem(
  shield: StandaloneShieldItem = STANDALONE_SHIELD,
): ArmorItem {
  return {
    name: shield.name,
    category: "shield",
    baseAC: shield.acBonus,
    maxDexBonus: null,
    rarity: shield.rarity,
    runeSlots: 0,
    stealthDisadvantage: false,
    weight: shield.weight,
  };
}
