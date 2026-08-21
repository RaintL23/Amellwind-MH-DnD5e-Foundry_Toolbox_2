import type { ResourceRarity } from "@/shared/types";
import { INLINE_REACTION_ATTACK_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Uncommon for a reaction attack that uses a natural weapon or unarmed
 * strike (Tigerstripe Zamtrios / Congalala-style), when no stronger inline
 * rarity already applied. Requires `reaction` plus `natural-weapon` or `unarmed`.
 */
export function inferRarityFromReactionAttackTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:reaction")) return null;
  if (
    !set.has("mechanic:natural-weapon") &&
    !set.has("mechanic:unarmed")
  ) {
    return null;
  }
  return INLINE_REACTION_ATTACK_RARITY;
}
