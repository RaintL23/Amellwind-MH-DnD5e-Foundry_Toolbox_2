import type { ResourceRarity } from "@/shared/types";
import { INLINE_ACCELERATED_REST_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Uncommon for shortened rest duration (e.g. long rest in 4 hours).
 * Requires `accelerated-rest` — plain `long-rest` recharge gates do not qualify.
 */
export function inferRarityFromAcceleratedRestTags(
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:accelerated-rest")) return null;
  return INLINE_ACCELERATED_REST_RARITY;
}
