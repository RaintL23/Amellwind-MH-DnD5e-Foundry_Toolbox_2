import { EquippedWeapon, EquippedArmor, Rune, Weapon, ArmorItem } from "@/shared/types";

const RARITY_SLOT_MAP: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  "Very Rare": 4,
  Legendary: 5,
};

export function getRuneSlotsForRarity(rarity: string): number {
  return RARITY_SLOT_MAP[rarity] ?? 1;
}

export function makeWeaponSlot(weapon: Weapon, rarity: string): EquippedWeapon {
  const runeSlots = getRuneSlotsForRarity(rarity);
  const isTwoHanded = weapon.properties.includes("2H");
  return {
    weapon,
    rarity,
    runeSlots,
    runes: new Array<Rune | null>(runeSlots).fill(null),
    useVersatile: isTwoHanded,
  };
}

export function makeArmorSlot(armor: ArmorItem, rarity: string): EquippedArmor {
  const runeSlots = getRuneSlotsForRarity(rarity);
  return {
    armor,
    rarity,
    runeSlots,
    runes: new Array<Rune | null>(runeSlots).fill(null),
  };
}

export function resizeRunesForRarity(
  prevRunes: (Rune | null)[],
  newRarity: string,
): { rarity: string; runeSlots: number; runes: (Rune | null)[] } {
  const newSlots = getRuneSlotsForRarity(newRarity);
  const newRunes = new Array<Rune | null>(newSlots).fill(null);
  for (let i = 0; i < Math.min(prevRunes.length, newSlots); i++) {
    newRunes[i] = prevRunes[i];
  }
  return { rarity: newRarity, runeSlots: newSlots, runes: newRunes };
}
