import type { ResourceRarity } from "@/shared/types";
import { INLINE_EXTRA_LIMBS_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Uncommon for bonus-action extra-limb unarmed packages
 * (Adolescent Magala Nyctgem–style), when no stronger inline rarity applies.
 */
export function inferRarityFromExtraLimbsTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:extra-limbs")) return null;
  if (!set.has("mechanic:unarmed") || !set.has("mechanic:bonus-action")) {
    return null;
  }
  return INLINE_EXTRA_LIMBS_RARITY;
}
