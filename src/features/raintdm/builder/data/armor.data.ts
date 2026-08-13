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

export function isShieldArmor(armor: ArmorItem): boolean {
  return armor.category === "shield";
}

export function formatArmorSlotDetail(armor: ArmorItem): string {
  if (isClothingArmor(armor)) return "10 + DEX";
  if (isShieldArmor(armor)) return `+${armor.baseAC} AC`;
  return `AC ${armor.baseAC}`;
}

/**
 * Base armors available at the smithy (AGMH PHB table).
 * No +1/+3 variants — rarity upgrades come from crafting, not the catalog.
 */
export const BASE_ARMORS: ArmorItem[] = [
  // Light Armor
  {
    name: "Padded",
    category: "light",
    baseAC: 11,
    maxDexBonus: null,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: true,
    weight: 8,
  },
  {
    name: "Leather",
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
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: false,
    weight: 13,
  },

  // Medium Armor
  {
    name: "Hide",
    category: "medium",
    baseAC: 12,
    maxDexBonus: 2,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: false,
    weight: 12,
  },
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
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: true,
    weight: 45,
  },
  {
    name: "Breastplate",
    category: "medium",
    baseAC: 14,
    maxDexBonus: 2,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: false,
    weight: 20,
  },
  {
    name: "Half Plate",
    category: "medium",
    baseAC: 15,
    maxDexBonus: 2,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: true,
    weight: 40,
  },

  // Heavy Armor
  {
    name: "Ring Mail",
    category: "heavy",
    baseAC: 14,
    maxDexBonus: 0,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: true,
    weight: 40,
  },
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
    name: "Splint Mail",
    category: "heavy",
    baseAC: 17,
    maxDexBonus: 0,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: true,
    weight: 60,
  },
  {
    name: "Plate Mail",
    category: "heavy",
    baseAC: 18,
    maxDexBonus: 0,
    rarity: "Common",
    runeSlots: 1,
    stealthDisadvantage: true,
    weight: 65,
  },
];
