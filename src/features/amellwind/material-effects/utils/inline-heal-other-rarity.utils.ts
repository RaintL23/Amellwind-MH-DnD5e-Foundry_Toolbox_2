import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_HEAL_OTHER_MAJOR_RARITY,
  INLINE_HEAL_OTHER_MINOR_RARITY,
} from "../constants/material-effect.constants";

/**
 * Outgoing heal-buff rarity (`mechanic:heal-other:minor` / `:major`).
 */
export function inferRarityFromHealOtherTags(
  tags: string[],
): ResourceRarity | null {
  if (tags.includes("mechanic:heal-other:major")) {
    return INLINE_HEAL_OTHER_MAJOR_RARITY;
  }
  if (
    tags.includes("mechanic:heal-other:minor") ||
    tags.includes("mechanic:heal-other")
  ) {
    return INLINE_HEAL_OTHER_MINOR_RARITY;
  }
  return null;
}
