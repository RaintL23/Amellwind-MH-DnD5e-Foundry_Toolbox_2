export type EquipmentRarityFilter =
  | "Standard"
  | "Uncommon"
  | "Rare"
  | "Very Rare"
  | "Legendary";

export const EQUIPMENT_RARITY_FILTERS: EquipmentRarityFilter[] = [
  "Standard",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
];

export function matchesEquipmentRarityFilter(
  itemRarityLabel: string,
  filter: EquipmentRarityFilter,
): boolean {
  return itemRarityLabel === filter;
}
