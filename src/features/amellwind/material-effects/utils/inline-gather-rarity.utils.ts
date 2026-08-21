import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_GATHER_RESOURCES_MAJOR_RARITY,
  INLINE_GATHER_RESOURCES_RARITY,
} from "../constants/material-effect.constants";

/**
 * Infers rarity for MH gather-resource effects.
 * - `gather-resources:major` (1d4 / party double / free gather) → Rare
 * - bare `gather-resources` (x2 catch/gather) → Uncommon
 */
export function inferRarityFromGatherResourceTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (set.has("mechanic:gather-resources:major")) {
    return INLINE_GATHER_RESOURCES_MAJOR_RARITY;
  }
  if (set.has("mechanic:gather-resources")) {
    return INLINE_GATHER_RESOURCES_RARITY;
  }
  return null;
}
