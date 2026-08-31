import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_HEALING_MAJOR_RARITY,
  INLINE_HEALING_MINOR_RARITY,
} from "../constants/material-effect.constants";

/** Infers rarity for self-healing tags (`mechanic:healing:minor` / `:major`). */
export function inferRarityFromHealingTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (set.has("mechanic:healing:major") || set.has("mechanic:regeneration")) {
    return INLINE_HEALING_MAJOR_RARITY;
  }
  if (set.has("mechanic:healing:minor")) {
    return INLINE_HEALING_MINOR_RARITY;
  }
  return null;
}
