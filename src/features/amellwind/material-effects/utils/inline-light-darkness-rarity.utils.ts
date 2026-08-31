import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_DARKNESS_UTILITY_RARITY,
  INLINE_DARKVISION_RARITY,
  INLINE_LIGHT_RARITY,
  INLINE_LIGHT_SUPPRESSION_RARITY,
  INLINE_MAGICAL_DARKNESS_SIGHT_RARITY,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

/**
 * Infers rarity for light / darkvision / magical-darkness sight grants.
 *
 * | Tags | Rarity |
 * | magical-darkness | Rare |
 * | darkvision | Uncommon |
 * | light (shed bright/dim) | Common |
 *
 * | light-suppression | Common |
 * | nonmagical-darkness + active (Hide BA) | Uncommon |
 */
export function inferRarityFromLightDarknessTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  let best: ResourceRarity | null = null;

  if (set.has("mechanic:magical-darkness")) {
    best = INLINE_MAGICAL_DARKNESS_SIGHT_RARITY;
  }

  if (set.has("mechanic:darkvision")) {
    best = best
      ? higherRarity(best, INLINE_DARKVISION_RARITY)
      : INLINE_DARKVISION_RARITY;
  }

  if (set.has("mechanic:light") || set.has("mechanic:light-suppression")) {
    const lightRarity = set.has("mechanic:light-suppression")
      ? INLINE_LIGHT_SUPPRESSION_RARITY
      : INLINE_LIGHT_RARITY;
    best = best ? higherRarity(best, lightRarity) : lightRarity;
  }

  if (
    set.has("mechanic:nonmagical-darkness") &&
    set.has("mechanic:active") &&
    !set.has("mechanic:light") &&
    !set.has("mechanic:light-suppression") &&
    !set.has("mechanic:darkvision") &&
    !set.has("mechanic:magical-darkness")
  ) {
    best = best
      ? higherRarity(best, INLINE_DARKNESS_UTILITY_RARITY)
      : INLINE_DARKNESS_UTILITY_RARITY;
  }

  return best;
}
