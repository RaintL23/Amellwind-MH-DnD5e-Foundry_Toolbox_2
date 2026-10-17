/**
 * AGMH "Creating a Higher Level Character": the highest weapon/armor rarity a
 * new character can reach (starting gear plus rolled upgrade materials).
 * Only used for a soft warning — experimenting with any rarity is allowed.
 */
import { RARITY_ORDER } from "@/shared/types";

export function getStartingRarityCeiling(level: number): string {
  if (level >= 16) return "Very Rare";
  if (level >= 9) return "Rare";
  if (level >= 3) return "Uncommon";
  return "Common";
}

export function exceedsStartingRarity(rarity: string, level: number): boolean {
  const order: readonly string[] = RARITY_ORDER;
  const index = order.indexOf(rarity);
  return index > order.indexOf(getStartingRarityCeiling(level));
}
