import type { ResourceRarity } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { matchesFlatDamageReduction } from "@/features/amellwind/runes/utils/rune-damage-reduction.utils";
import {
  INLINE_FLAT_DAMAGE_REDUCTION_RARITY,
  INLINE_LIMITED_FLAT_DAMAGE_REDUCTION_RARITY,
} from "../constants/material-effect.constants";

/** Pool / uses / long-rest gated DR (not always-on while wearing). */
const LIMITED_FLAT_DR =
  /(?:pool of|expend(?: one or more)?|uses equal to|number of times equal to|regain all expended|finish a long rest|can't be used again until)/i;

/**
 * Infers rarity from always-on or limited flat damage reduction in rune text,
 * e.g. "You reduce fire damage you take by 3 while you wear this armor."
 */
export function inferInlineFlatDamageReductionRarity(
  text: string,
): ResourceRarity | null {
  const parsed = parseFiveToolsMarkup(text);
  if (!matchesFlatDamageReduction(parsed)) return null;

  if (LIMITED_FLAT_DR.test(parsed)) {
    return INLINE_LIMITED_FLAT_DAMAGE_REDUCTION_RARITY;
  }
  return INLINE_FLAT_DAMAGE_REDUCTION_RARITY;
}
