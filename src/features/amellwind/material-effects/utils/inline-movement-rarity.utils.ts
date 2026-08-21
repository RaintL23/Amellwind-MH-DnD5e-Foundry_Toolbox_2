import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_FLYING_SPEED_MAJOR_RARITY,
  INLINE_FLYING_SPEED_RARITY,
  INLINE_ICY_SURFACES_RARITY,
  INLINE_MOVEMENT_MODE_RARITY,
  INLINE_WALKING_SPEED_MINOR_RARITY,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

/**
 * Infers rarity for movement-mode and walking-speed grants.
 * Speed debuffs on hit (`movement` alone) return null.
 *
 * | Tags | Rarity |
 * | flying + major (60+ ft) | Very Rare |
 * | flying | Rare |
 * | burrowing / swimming / climbing / walk+major / icy-surfaces | Uncommon |
 * | walking-speed (+5) | Common |
 * | ignore-difficult-terrain alone (no icy / mode grant) | Common |
 */
export function inferRarityFromMovementTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:movement")) return null;

  let best: ResourceRarity | null = null;

  if (set.has("mechanic:flying")) {
    best = set.has("mechanic:movement:major")
      ? INLINE_FLYING_SPEED_MAJOR_RARITY
      : INLINE_FLYING_SPEED_RARITY;
  }

  if (
    set.has("mechanic:burrowing") ||
    set.has("mechanic:swimming") ||
    set.has("mechanic:climbing")
  ) {
    best = best
      ? higherRarity(best, INLINE_MOVEMENT_MODE_RARITY)
      : INLINE_MOVEMENT_MODE_RARITY;
  }

  if (set.has("mechanic:icy-surfaces")) {
    best = best
      ? higherRarity(best, INLINE_ICY_SURFACES_RARITY)
      : INLINE_ICY_SURFACES_RARITY;
  } else if (
    set.has("mechanic:ignore-difficult-terrain") ||
    set.has("mechanic:movement-climb")
  ) {
    // Generic ignore-DT / climb-without-check without ice package → Common.
    best = best
      ? higherRarity(best, INLINE_WALKING_SPEED_MINOR_RARITY)
      : INLINE_WALKING_SPEED_MINOR_RARITY;
  }

  if (set.has("mechanic:walking-speed")) {
    const walk = set.has("mechanic:movement:major")
      ? INLINE_MOVEMENT_MODE_RARITY
      : INLINE_WALKING_SPEED_MINOR_RARITY;
    best = best ? higherRarity(best, walk) : walk;
  }

  return best;
}
