import type { ResourceRarity } from "@/shared/types";
import { INLINE_BASE_AC_RARITY_BY_SCORE } from "../constants/material-effect.constants";

/** Parses "base Armor Class is 14 + your Dexterity modifier" style grants. */
export function parseBaseAcScore(text: string): number | null {
  const match = text.match(/\bbase Armor Class is (\d+)/i);
  if (!match) return null;
  const score = parseInt(match[1] ?? "", 10);
  return Number.isFinite(score) ? score : null;
}

function rarityForBaseAcScore(score: number): ResourceRarity {
  for (const band of INLINE_BASE_AC_RARITY_BY_SCORE) {
    if (score <= band.maxScore) return band.rarity;
  }
  return INLINE_BASE_AC_RARITY_BY_SCORE[INLINE_BASE_AC_RARITY_BY_SCORE.length - 1]
    .rarity;
}

/**
 * Infers rarity for unarmored-defense-style base AC (Magala carapace pattern),
 * distinct from flat +N AC bonuses.
 */
export function inferRarityFromBaseAc(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:base-ac")) return null;
  const score = parseBaseAcScore(text);
  if (score == null) return null;
  return rarityForBaseAcScore(score);
}
