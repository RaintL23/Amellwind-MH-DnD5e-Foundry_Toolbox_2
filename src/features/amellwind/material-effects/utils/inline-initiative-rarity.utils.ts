import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_INITIATIVE_ADVANTAGE_RARITY,
  INLINE_INITIATIVE_MAJOR_RARITY,
} from "../constants/material-effect.constants";

/**
 * Initiative utility rarity from tags.
 * - `mechanic:initiative:major` → Rare (die bonus / go first)
 * - `mechanic:initiative` → Uncommon (incl. always-on advantage)
 */
export function inferRarityFromInitiativeTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (set.has("mechanic:initiative:major")) {
    return INLINE_INITIATIVE_MAJOR_RARITY;
  }
  if (set.has("mechanic:initiative")) {
    return INLINE_INITIATIVE_ADVANTAGE_RARITY;
  }
  return null;
}
