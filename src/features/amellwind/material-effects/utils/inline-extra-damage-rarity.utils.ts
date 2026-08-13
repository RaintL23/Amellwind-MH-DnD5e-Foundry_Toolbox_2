import type { ResourceRarity } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  INLINE_EXTRA_DAMAGE_LEGENDARY_RARITY,
  INLINE_EXTRA_DAMAGE_RARITY_BY_SCORE,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";

/** Always-on weapon extra-damage lines like "Your weapon deals an extra 2d6 necrotic damage." */
const EXTRA_DAMAGE_GRANT =
  /\b(?:your\s+weapon\s+deals?|deals?)\s+an?\s+extra\s+(?:\{@damage\s+)?(\d+d\d+|\d+)(?:\})?(?:\s+\w+)?\s+damage\b/i;

/** Target/creature takes NdX damage from the effect (crit DoT, on-hit riders, etc.). */
const TARGET_TAKES_DAMAGE =
  /\b(?:the\s+)?(?:target|creature)\b[\s\S]{0,60}?\btakes?\b[\s\S]{0,40}?(?:\{@damage\s+)?(\d+d\d+|\d+)(?:\})?(?:\s+\w+)?\s+damage\b/i;

/** Effect deals NdX damage (not "you take …" self-damage). */
const DEALS_DAMAGE =
  /\bdeals?\s+(?:\{@damage\s+)?(\d+d\d+|\d+)(?:\})?(?:\s+\w+)?\s+damage\b/i;

function parseLargestDiceScore(text: string): number {
  const matches = [...text.matchAll(/(\d+)d(\d+)/gi)];
  if (!matches.length) return 0;
  return Math.max(...matches.map(([, n, s]) => parseInt(n, 10) * parseInt(s, 10)));
}

function parseFlatDamageAmount(text: string): number | null {
  const flat = text.match(
    /(?:extra|takes?|deals?)\s+(?:\{@damage\s+)?(\d+)(?:\})?\s+\w+\s+damage/i,
  );
  if (!flat) return null;
  return parseInt(flat[1], 10);
}

function parseWeaponDamageScore(text: string): number | null {
  const diceScore = parseLargestDiceScore(text);
  if (diceScore > 0) return diceScore;
  return parseFlatDamageAmount(text);
}

function isWeaponDamageSentence(sentence: string): boolean {
  if (/\byou take\b/i.test(sentence)) return false;
  if (EXTRA_DAMAGE_GRANT.test(sentence) || /extra (?:\{@damage|\d+)/i.test(sentence)) {
    return true;
  }
  if (TARGET_TAKES_DAMAGE.test(sentence)) return true;
  if (DEALS_DAMAGE.test(sentence)) return true;
  return false;
}

export function rarityForExtraDamageScore(score: number): ResourceRarity {
  for (const band of INLINE_EXTRA_DAMAGE_RARITY_BY_SCORE) {
    if (score <= band.maxScore) return band.rarity;
  }
  return INLINE_EXTRA_DAMAGE_LEGENDARY_RARITY;
}

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

/**
 * Infers rarity from weapon damage in rune text (always-on extra, on-crit DoT, on-hit).
 * Score = dice count × faces (e.g. 2d6 → 12) or flat amount.
 *
 * | Score | Rarity |
 * | ≤6 | Uncommon |
 * | 7–12 | Rare |
 * | 13–20 | Very Rare |
 * | ≥21 | Legendary |
 */
export function inferInlineExtraDamageRarity(
  text: string,
): ResourceRarity | null {
  if (!text.trim()) return null;

  const parsed = parseFiveToolsMarkup(text);
  const sentences = parsed.split(/(?<=[.!?])\s+|\n+/);
  let best: ResourceRarity | null = null;

  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence || !isWeaponDamageSentence(sentence)) continue;

    const score = parseWeaponDamageScore(sentence);
    if (score === null || score <= 0) continue;

    const rarity = rarityForExtraDamageScore(score);
    best = best ? higherRarity(best, rarity) : rarity;
  }

  return best;
}
