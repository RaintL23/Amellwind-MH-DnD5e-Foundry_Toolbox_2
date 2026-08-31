/**
 * Shared flat damage-reduction detection for rune effect text (MHMM prose).
 * Used by tag extraction and material-effect tier inference.
 */

/** "You reduce fire damage you take by 3" / "…damage you take from ranged … by 2". */
const FLAT_DR_YOU_TAKE_RE =
  /(?:reduce|reduces)\s+(?:(?:[\w-]+\s+)*damage)\s+you take(?:\s+from[^.]+)?\s+by\s+\d+/i;

const LEGACY_DR_PATTERNS: RegExp[] = [
  /(?:reduce|reduces) (?:the |that |any )?damage(?: you take)? (?:by|to)/i,
  /damage (?:you take )?is reduced (?:by|to)/i,
  /when you (?:take|would take)(?: \w+)* damage[^.]*reduce/i,
  /halve the (?:attack'?s? )?damage against you/i,
];

/** MHMM source text often uses curly apostrophes (U+2019). */
export function normalizeEffectApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'");
}

/** True when the text describes reducing incoming damage (flat DR, pools, etc.). */
export function matchesFlatDamageReduction(text: string): boolean {
  const normalized = normalizeEffectApostrophes(text);
  if (FLAT_DR_YOU_TAKE_RE.test(normalized)) return true;
  return LEGACY_DR_PATTERNS.some((pattern) => pattern.test(normalized));
}
