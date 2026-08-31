import type { ResourceRarity } from "@/shared/types";
import { INLINE_COSMETIC_RARITY } from "../constants/material-effect.constants";

/** Infers Common for MHMM "(Cosmetic)" material effects (flavor-only). */
export function inferRarityFromCosmeticTags(
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("type:cosmetic")) return null;
  return INLINE_COSMETIC_RARITY;
}
