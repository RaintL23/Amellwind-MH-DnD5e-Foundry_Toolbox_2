import { EquippedWeapon, EquippedArmor, Rune, Weapon, ArmorItem } from "@/shared/types";
import { hasWeaponSwitchModes } from "@/features/weapons/utils/weapon-mode.utils";

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

const DND_FIXED_RARITY = "Standard";

function resolveDndEquippedRarity(weapon: Weapon, rarity: string): string {
  if (weapon.itemRarityLabel && weapon.itemRarityLabel !== "Standard") {
    return weapon.itemRarityLabel;
  }
  return rarity === "Standard" || rarity === "Common" ? DND_FIXED_RARITY : rarity;
}

export function makeWeaponSlot(weapon: Weapon, rarity: string): EquippedWeapon {
  const isDnd = weapon.contentSource === "dnd";
  const effectiveRarity = isDnd ? resolveDndEquippedRarity(weapon, rarity) : rarity;
  const runeSlots = isDnd ? 0 : getRuneSlotsForRarity(rarity);
  const isTwoHanded = weapon.properties.includes("2H");
  return {
    weapon,
    rarity: effectiveRarity,
    runeSlots,
    runes: new Array<Rune | null>(runeSlots).fill(null),
    useVersatile: hasWeaponSwitchModes(weapon) ? false : isTwoHanded,
  };
}

export function makeArmorSlot(
  armor: ArmorItem,
  rarity: string,
  homebrewEnabled = true,
): EquippedArmor {
  const isDnd = armor.contentSource === "dnd";
  const dndRarity =
    armor.itemRarityLabel && armor.itemRarityLabel !== "Standard"
      ? armor.itemRarityLabel
      : DND_FIXED_RARITY;
  const effectiveRarity = isDnd ? dndRarity : homebrewEnabled ? rarity : DND_FIXED_RARITY;
  const runeSlots = homebrewEnabled ? getRuneSlotsForRarity(rarity) : 0;
  return {
    armor,
    rarity: effectiveRarity,
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
