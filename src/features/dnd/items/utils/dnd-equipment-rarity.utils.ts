/**
 * Normalizes a raw 5etools item rarity into the label used by the D&D
 * equipment catalogs (weapons/armor) and the builder's rarity filters.
 * "none"/"common" collapse to "Standard"; everything else keeps its tier.
 */
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
