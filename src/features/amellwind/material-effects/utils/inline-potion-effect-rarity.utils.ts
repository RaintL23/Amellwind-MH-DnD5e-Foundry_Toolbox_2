import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_POTION_EFFECT_RARITY_BY_GIANT,
  INLINE_POTION_EFFECT_RARITY_DEFAULT,
} from "../constants/material-effect.constants";

/** Maps MHMM "potion of X giant(s) strength" wording to a DMG-aligned tier. */
const GIANT_POTION_PATTERNS: Array<[RegExp, ResourceRarity]> = [
  [/storm giant/i, INLINE_POTION_EFFECT_RARITY_BY_GIANT.storm],
  [/cloud giant/i, INLINE_POTION_EFFECT_RARITY_BY_GIANT.cloud],
  [/fire giant/i, INLINE_POTION_EFFECT_RARITY_BY_GIANT.fire],
  [/(?:frost|stone) giant/i, INLINE_POTION_EFFECT_RARITY_BY_GIANT.frostStone],
  [/hill giant/i, INLINE_POTION_EFFECT_RARITY_BY_GIANT.hill],
];

/**
 * Infers rarity for weapon properties that replicate a giant-strength potion
 * ("same benefits as a potion of … for 1 hour / 10 minutes").
 */
export function inferRarityFromPotionEffectTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:potion-effect")) return null;

  for (const [pattern, rarity] of GIANT_POTION_PATTERNS) {
    if (pattern.test(text)) return rarity;
  }

  if (/same benefits as a potion of/i.test(text)) {
    return INLINE_POTION_EFFECT_RARITY_DEFAULT;
  }

  return null;
}
