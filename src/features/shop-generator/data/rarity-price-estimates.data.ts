/**
 * Campaign-realistic midpoints (gp) by rarity when neither the pricing CSV
 * nor the 5etools catalog value is available. Anchored to common DMG/XGE
 * guidance ranges, biased toward playable shop economy.
 */
export const RARITY_PRICE_ESTIMATES_GP: Readonly<Record<string, number>> = {
  none: 25,
  common: 75,
  uncommon: 400,
  rare: 4000,
  "very rare": 20000,
  legendary: 100000,
  artifact: 250000,
  varies: 500,
  unknown: 100,
};

export function estimatePriceByRarity(rarity: string): number {
  const key = rarity.trim().toLowerCase();
  return RARITY_PRICE_ESTIMATES_GP[key] ?? RARITY_PRICE_ESTIMATES_GP.unknown;
}
