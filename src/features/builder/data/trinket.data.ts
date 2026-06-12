export const TRINKET_WEIGHT_LB = 0.1;

export const PLACEHOLDER_TRINKETS = [
  "Rune Holder A",
  "Rune Holder B",
  "Rune Holder C",
] as const;

export type PlaceholderTrinketName = (typeof PLACEHOLDER_TRINKETS)[number];

export function isKnownTrinket(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return PLACEHOLDER_TRINKETS.some(
    (trinket) => trinket.toLowerCase() === normalized,
  );
}
