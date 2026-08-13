import type { ResourceRarity } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  INLINE_EXTRA_DAMAGE_LEGENDARY_RARITY,
  INLINE_EXTRA_DAMAGE_RARITY_BY_SCORE,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";

/** True for always-on weapon extra-damage lines like "Your weapon deals an extra 2d6 necrotic damage." */
const EXTRA_DAMAGE_GRANT =
  /\b(?:your\s+weapon\s+deals?|deals?)\s+an?\s+extra\s+(?:\{@damage\s+)?(\d+d\d+|\d+)(?:\})?(?:\s+\w+)?\s+damage\b/i;

function parseLargestDiceScore(text: string): number {
  const matches = [...text.matchAll(/(\d+)d(\d+)/gi)];
  if (!matches.length) return 0;
  return Math.max(...matches.map(([, n, s]) => parseInt(n, 10) * parseInt(s, 10)));
}

function parseExtraDamageScore(text: string): number | null {
  if (!/extra (?:\{@damage|\d+)/i.test(text)) return null;

  const diceScore = parseLargestDiceScore(text);
  if (diceScore > 0) return diceScore;

  const flat = text.match(/extra\s+(\d+)\s+\w+\s+damage/i);
  if (!flat) return null;
  return parseInt(flat[1], 10);
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
 * Infers rarity from always-on extra weapon damage in rune text.
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
    if (!sentence) continue;
    if (!EXTRA_DAMAGE_GRANT.test(sentence) && !/extra (?:\{@damage|\d+)/i.test(sentence)) {
      continue;
    }

    const score = parseExtraDamageScore(sentence);
    if (score === null || score <= 0) continue;

    const rarity = rarityForExtraDamageScore(score);
    best = best ? higherRarity(best, rarity) : rarity;
  }

  return best;
}
