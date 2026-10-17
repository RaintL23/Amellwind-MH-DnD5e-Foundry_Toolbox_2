import type { Weapon } from "@/shared/types";

/**
 * AGMH "Unarmed Strikes": handwraps, gauntlets or knuckles attuned instead of
 * a weapon. Treated as a weapon for upgrading, attunement and materials, with
 * one extra material slot at every rarity (an uncommon one has 3 slots).
 */
export const AMELLWIND_UNARMED_ITEM: Weapon = {
  id: "unarmed-item|agmh",
  name: "Unarmed Item",
  source: "AGMH",
  contentSource: "amellwind",
  dmg1: "1",
  dmgType: "B",
  properties: [],
  weight: 0,
  valueCp: 0,
  description:
    "A character can choose to attune to an \"unarmed item\" instead of a weapon, such as handwraps, gauntlets, or knuckles. This item is treated as a weapon for upgrading, attunement and material placement. This item has no special properties except that it offers 1 additional material slot per rarity level. E.g. an uncommon \"unarmed item\" would have 3 material slots rather than 2.",
  supplementaryNotes: [],
  rarityRows: [],
  baseFeatureNames: [],
};

export function isAmellwindUnarmedItem(
  weapon: Pick<Weapon, "name" | "source">,
): boolean {
  return (
    weapon.name === AMELLWIND_UNARMED_ITEM.name &&
    weapon.source === AMELLWIND_UNARMED_ITEM.source
  );
}
