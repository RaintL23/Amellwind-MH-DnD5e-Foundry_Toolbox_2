import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_DARKVISION_RARITY,
  INLINE_LIGHT_RARITY,
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
 * Bare `darkness` / `nonmagical-darkness` (Hide in dim light, light snuffing)
 * without light or sight grants returns null.
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

  if (set.has("mechanic:light")) {
    best = best ? higherRarity(best, INLINE_LIGHT_RARITY) : INLINE_LIGHT_RARITY;
  }

  return best;
}
