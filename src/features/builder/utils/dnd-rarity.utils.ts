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

export function mapDndRarityLabel(rawRarity?: string): string {
  switch (rawRarity?.toLowerCase()) {
    case "uncommon":
      return "Uncommon";
    case "rare":
      return "Rare";
    case "very rare":
      return "Very Rare";
    case "legendary":
      return "Legendary";
    case "none":
    case "common":
    default:
      return "Standard";
  }
}

export function matchesEquipmentRarityFilter(
  itemRarityLabel: string,
  filter: EquipmentRarityFilter,
): boolean {
  return itemRarityLabel === filter;
}
