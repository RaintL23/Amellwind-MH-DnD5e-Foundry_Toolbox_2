import { ArmorItem } from "@/shared/types";

/**
 * Clothing (AGMH): for classes without armor proficiency (e.g. casters, monk).
 * No AC bonus; rarity still grants material/rune slots like normal armor.
 */
export const CLOTHING_ARMOR: ArmorItem = {
  name: "Cloth",
  category: "clothing",
  baseAC: 10,
  maxDexBonus: null,
  rarity: "Common",
  runeSlots: 1,
  stealthDisadvantage: false,
  weight: 0,
};

export function isClothingArmor(armor: ArmorItem): boolean {
  return armor.category === "clothing";
}

export function formatArmorSlotDetail(armor: ArmorItem): string {
  return isClothingArmor(armor) ? "10 + DEX" : `AC ${armor.baseAC}`;
}

/**
 * Placeholder armor data until real armor indexing is implemented.
 * Based on D&D 5e standard armor with MH-style rarity tiers.
 */
export const PLACEHOLDER_ARMORS: ArmorItem[] = [
  // Light Armor
  {
    name: "Leather Armor",
    category: "light",
    baseAC: 11,
    maxDexBonus: null,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: false,
    weight: 10,
  },
  {
    name: "Studded Leather",
    category: "light",
    baseAC: 12,
    maxDexBonus: null,
    rarity: "Uncommon",
    runeSlots: 2,
    stealthDisadvantage: false,
    weight: 13,
  },
  {
    name: "Kulu Hide",
    category: "light",
    baseAC: 12,
    maxDexBonus: null,
    rarity: "Rare",
    runeSlots: 3,
    stealthDisadvantage: false,
    weight: 12,
  },

  // Medium Armor
  {
    name: "Chain Shirt",
    category: "medium",
    baseAC: 13,
    maxDexBonus: 2,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: false,
    weight: 20,
  },
  {
    name: "Scale Mail",
    category: "medium",
    baseAC: 14,
    maxDexBonus: 2,
    rarity: "Uncommon",
    runeSlots: 2,
    stealthDisadvantage: true,
    weight: 45,
  },
  {
    name: "Rathalos Mail",
    category: "medium",
    baseAC: 15,
    maxDexBonus: 2,
    rarity: "Rare",
    runeSlots: 3,
    stealthDisadvantage: false,
    weight: 40,
  },
  {
    name: "Nergigante Mail",
    category: "medium",
    baseAC: 15,
    maxDexBonus: 2,
    rarity: "Very Rare",
    runeSlots: 4,
    stealthDisadvantage: false,
    weight: 38,
  },

  // Heavy Armor
  {
    name: "Chain Mail",
    category: "heavy",
    baseAC: 16,
    maxDexBonus: 0,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: true,
    weight: 55,
  },
  {
    name: "Splint Armor",
    category: "heavy",
    baseAC: 17,
    maxDexBonus: 0,
    rarity: "Uncommon",
    runeSlots: 2,
    stealthDisadvantage: true,
    weight: 60,
  },
  {
    name: "Diablos Plate",
    category: "heavy",
    baseAC: 18,
    maxDexBonus: 0,
    rarity: "Rare",
    runeSlots: 3,
    stealthDisadvantage: true,
    weight: 65,
  },
  {
    name: "Fatalis Armor",
    category: "heavy",
    baseAC: 18,
    maxDexBonus: 0,
    rarity: "Very Rare",
    runeSlots: 4,
    stealthDisadvantage: true,
    weight: 65,
  },
  {
    name: "Safi'jiiva Plate",
    category: "heavy",
    baseAC: 19,
    maxDexBonus: 0,
    rarity: "Legendary",
    runeSlots: 5,
    stealthDisadvantage: true,
    weight: 70,
  },
];
