import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_ATTACK_RANGE_MAJOR_RARITY,
  INLINE_ATTACK_RANGE_RARITY,
} from "../constants/material-effect.constants";

/**
 * Infers rarity for weapon attack-range grants (Deadeye / Deadeye+).
 * - `attack-range:major` (doubled) → Uncommon
 * - bare `attack-range` (+N ft) → Common
 */
export function inferRarityFromAttackRangeTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (set.has("mechanic:attack-range:major")) {
    return INLINE_ATTACK_RANGE_MAJOR_RARITY;
  }
  if (set.has("mechanic:attack-range")) {
    return INLINE_ATTACK_RANGE_RARITY;
  }
  return null;
}
