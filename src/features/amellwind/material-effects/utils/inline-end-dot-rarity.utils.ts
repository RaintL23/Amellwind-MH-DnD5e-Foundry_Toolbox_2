import type { ResourceRarity } from "@/shared/types";
import { INLINE_END_DOT_RARITY } from "../constants/material-effect.constants";

/**
 * Always-on end of damage-over-time at start of turn (Recovery Level).
 * Requires `mechanic:end-dot`.
 */
export function inferRarityFromEndDotTags(
  effectTags: string[],
): ResourceRarity | null {
  if (!effectTags.includes("mechanic:end-dot")) return null;
  return INLINE_END_DOT_RARITY;
}
