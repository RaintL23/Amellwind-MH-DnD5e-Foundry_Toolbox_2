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
];

/** True when the text describes reducing incoming damage (flat DR, pools, etc.). */
export function matchesFlatDamageReduction(text: string): boolean {
  if (FLAT_DR_YOU_TAKE_RE.test(text)) return true;
  return LEGACY_DR_PATTERNS.some((pattern) => pattern.test(text));
}
