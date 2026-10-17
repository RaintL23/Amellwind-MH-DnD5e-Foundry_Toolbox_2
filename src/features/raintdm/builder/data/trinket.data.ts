export const TRINKET_WEIGHT_LB = 0.1;

/**
 * AGMH: a trinket is a PHB trinket (table p.159) or a trophy from a creature
 * you hunted — any name works. These are quick picks; the list also accepts a
 * custom name.
 */
export const SUGGESTED_TRINKETS = [
  "Monster Trophy",
  "Keepsake Trinket",
] as const;

/** Names written by older builds before custom trinket names existed. */
const LEGACY_TRINKET_NAMES = ["Rune Holder A", "Rune Holder B", "Rune Holder C"];

export function isKnownTrinket(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return [...SUGGESTED_TRINKETS, ...LEGACY_TRINKET_NAMES].some(
    (trinket) => trinket.toLowerCase() === normalized,
  );
}
