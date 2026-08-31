import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_BREATHE_ANY_ENVIRONMENT_RARITY,
  INLINE_HOLD_BREATH_UNDERWATER_RARITY,
} from "../constants/material-effect.constants";

/**
 * Infers Common for extended hold-breath underwater (e.g. "twice as long").
 * Requires both `hold-breath` and `underwater`. Does not cover full water
 * breathing (`breathe underwater`) which lacks the hold-breath tag.
 */
export function inferRarityFromHoldBreathUnderwaterTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (set.has("mechanic:breathe-any-environment")) {
    return INLINE_BREATHE_ANY_ENVIRONMENT_RARITY;
  }
  if (!set.has("mechanic:hold-breath")) return null;
  if (!set.has("mechanic:underwater")) return null;
  return INLINE_HOLD_BREATH_UNDERWATER_RARITY;
}
