import type { ResourceRarity } from "@/shared/types";
import { INLINE_CLASS_RESOURCE_RECOVERY_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Uncommon for restoring an expended class pool (ki, sorcery points, …).
 * Requires `mechanic:recover-class-resource`.
 */
export function inferRarityFromClassResourceRecoveryTags(
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:recover-class-resource")) return null;
  return INLINE_CLASS_RESOURCE_RECOVERY_RARITY;
}
