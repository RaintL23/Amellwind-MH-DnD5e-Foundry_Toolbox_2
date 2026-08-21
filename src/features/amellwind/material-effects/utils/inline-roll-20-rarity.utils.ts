import type { ResourceRarity } from "@/shared/types";
import { INLINE_ROLL20_PUSH_NO_DAMAGE_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Common for a nat-20 rider that only pushes and deals no extra damage.
 * Returns null unless all three tags are present (`roll-20`, `no-damage`, `push`).
 */
export function inferRarityFromRoll20UtilityTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:roll-20")) return null;
  if (!set.has("mechanic:no-damage")) return null;
  if (!set.has("mechanic:push")) return null;
  return INLINE_ROLL20_PUSH_NO_DAMAGE_RARITY;
}
