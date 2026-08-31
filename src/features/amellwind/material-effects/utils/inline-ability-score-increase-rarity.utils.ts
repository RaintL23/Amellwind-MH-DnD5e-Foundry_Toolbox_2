import type { ResourceRarity } from "@/shared/types";
import { INLINE_ABILITY_SCORE_INCREASE_RARITY } from "../constants/material-effect.constants";

function parseAbilityScoreIncrease(text: string): number | null {
  const match = text.match(
    /(?:increase|increases)\s+your\s+(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+score\s+by\s+(\d+)/i,
  );
  return match ? parseInt(match[1], 10) : null;
}

/** Infers Uncommon for always-on +1 ability score (not a set floor). */
export function inferRarityFromAbilityScoreIncreaseTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:ability-score-increase")) return null;
  const amount = parseAbilityScoreIncrease(text);
  if (amount == null || amount < 1) return INLINE_ABILITY_SCORE_INCREASE_RARITY;
  if (amount >= 2) return "Rare";
  return INLINE_ABILITY_SCORE_INCREASE_RARITY;
}
