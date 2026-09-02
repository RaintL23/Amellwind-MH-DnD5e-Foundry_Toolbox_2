/**
 * Shared parsing for ability-score floor effects (Gauntlets of Ogre Power–style).
 * Used by rune tag extraction and inline material-effect rarity inference.
 */

const ABILITY_NAMES =
  "Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma";

/** Optional 5e abbreviations — whole-word only (not "Intelligence" → "Int"). */
const ABILITY_ABBREVS = "Str|Dex|Con|Int|Wis|Cha";

/**
 * Verbs / phrasing that set a score to a fixed value.
 * Excludes "+N" increases (`score by N`) — those are ability-score-increase.
 */
const SCORE_SET_VERB =
  "(?:is|becomes|changes\\s+to|is\\s+set\\s+to|is\\s+changed\\s+to|increases?\\s+to|rises?\\s+to)";

/** `your Strength score changes to 25`, `Dexterity becomes 19`, … */
const ABILITY_SCORE_SET_RE = new RegExp(
  String.raw`\b(?:your\s+)?(?:${ABILITY_NAMES}|${ABILITY_ABBREVS})(?:\s+score)?\s+${SCORE_SET_VERB}\s+(\d+)\b`,
  "i",
);

/** `Strength score of 25` (less common MHMM wording). */
const ABILITY_SCORE_OF_RE = new RegExp(
  String.raw`\b(?:${ABILITY_NAMES}|${ABILITY_ABBREVS})\s+score\s+of\s+(\d+)\b`,
  "i",
);

/** Parses the target floor value from effect text, or null when not a set effect. */
export function parseInlineAbilityScoreSet(text: string): number | null {
  const match =
    text.match(ABILITY_SCORE_SET_RE) ?? text.match(ABILITY_SCORE_OF_RE);
  return match ? parseInt(match[1], 10) : null;
}

/** True when the text sets an ability score to a fixed value while worn/attuned. */
export function matchesInlineAbilityScoreSet(text: string): boolean {
  return parseInlineAbilityScoreSet(text) != null;
}
