import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_CLASS_FEATURE_EXTRA_USE_RARITY,
  INLINE_CLASS_RESOURCE_RECOVERY_RARITY,
} from "../constants/material-effect.constants";

/**
 * Infers Uncommon for restoring an expended class pool (ki, sorcery points, …).
 * Requires `mechanic:recover-class-resource`.
 */
export function inferRarityFromClassResourceRecoveryTags(
  tags: string[],
): ResourceRarity | null {
  if (tags.includes("mechanic:recover-class-resource")) {
    return INLINE_CLASS_RESOURCE_RECOVERY_RARITY;
  }
  if (tags.includes("mechanic:class-feature-extra-use")) {
    return INLINE_CLASS_FEATURE_EXTRA_USE_RARITY;
  }
  return null;
}
