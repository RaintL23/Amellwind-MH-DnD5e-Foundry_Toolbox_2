import { EquippedWeapon, EquippedArmor, Rune, Weapon, ArmorItem } from "@/shared/types";
import { isAmellwindUnarmedItem } from "../data/unarmed-item.data";
import {
  hasWeaponSwitchModes,
  isVersatileGripWeapon,
} from "@/features/amellwind/weapons/utils/weapon-mode.utils";

const RARITY_SLOT_MAP: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  "Very Rare": 4,
  Legendary: 5,
};

/**
 * Material slots for an Amellwind weapon/armor rarity. `bonusSlots` adds the
 * Artificer's extra slots (AGMH: +1 at artificer levels 10, 14 and 18).
 */
export function getRuneSlotsForRarity(rarity: string, bonusSlots = 0): number {
  return (RARITY_SLOT_MAP[rarity] ?? 1) + Math.max(0, bonusSlots);
}

const DND_FIXED_RARITY = "Standard";

/** AGMH unarmed item: one extra material slot at every rarity. */
export function getWeaponExtraSlots(weapon: Pick<Weapon, "name" | "source">): number {
  return isAmellwindUnarmedItem(weapon) ? 1 : 0;
}

function resolveDndEquippedRarity(weapon: Weapon, rarity: string): string {
  if (weapon.itemRarityLabel && weapon.itemRarityLabel !== "Standard") {
    return weapon.itemRarityLabel;
  }
  return rarity === "Standard" || rarity === "Common" ? DND_FIXED_RARITY : rarity;
}

export function makeWeaponSlot(
  weapon: Weapon,
  rarity: string,
  bonusSlots = 0,
): EquippedWeapon {
  const isDnd = weapon.contentSource === "dnd";
  const effectiveRarity = isDnd ? resolveDndEquippedRarity(weapon, rarity) : rarity;
  const runeSlots = isDnd
    ? 0
    : getRuneSlotsForRarity(rarity, bonusSlots + getWeaponExtraSlots(weapon));
  const isTwoHanded = weapon.properties.includes("2H");
  // Switch modes start in primary stance; versatile/2H default to two-hand die when applicable.
  const activeModeIndex = hasWeaponSwitchModes(weapon)
    ? 0
    : isVersatileGripWeapon(weapon)
      ? 0
      : isTwoHanded
        ? 1
        : 0;
  return {
    weapon,
    rarity: effectiveRarity,
    runeSlots,
    runes: new Array<Rune | null>(runeSlots).fill(null),
    activeModeIndex,
  };
}

export function makeArmorSlot(
  armor: ArmorItem,
  rarity: string,
  homebrewEnabled = true,
  bonusSlots = 0,
): EquippedArmor {
  const isDnd = armor.contentSource === "dnd";
  const dndRarity =
    armor.itemRarityLabel && armor.itemRarityLabel !== "Standard"
      ? armor.itemRarityLabel
      : DND_FIXED_RARITY;
  const effectiveRarity = isDnd ? dndRarity : homebrewEnabled ? rarity : DND_FIXED_RARITY;
  const runeSlots = homebrewEnabled
    ? getRuneSlotsForRarity(rarity, bonusSlots)
    : 0;
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
  bonusSlots = 0,
): { rarity: string; runeSlots: number; runes: (Rune | null)[] } {
  const newSlots = getRuneSlotsForRarity(newRarity, bonusSlots);
  const newRunes = new Array<Rune | null>(newSlots).fill(null);
  for (let i = 0; i < Math.min(prevRunes.length, newSlots); i++) {
    newRunes[i] = prevRunes[i];
  }
  return { rarity: newRarity, runeSlots: newSlots, runes: newRunes };
}
