import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_CONDITION_IMMUNITY_RARITY,
  INLINE_CONDITION_SAVE_ADVANTAGE_RARITY,
} from "../constants/material-effect.constants";

/**
 * Infers Common for always-on save help vs a condition (not immunity).
 * Requires `against-condition` + (`advantage` or `save-bonus`);
 * skips when immunity is also tagged.
 */
export function inferRarityFromConditionDefenseTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:against-condition")) return null;
  if (set.has("mechanic:immunity")) return null;
  if (!set.has("mechanic:advantage") && !set.has("mechanic:save-bonus")) {
    return null;
  }
  return INLINE_CONDITION_SAVE_ADVANTAGE_RARITY;
}

/**
 * Infers Uncommon for immunity to a named condition (`condition-*` + `immunity`).
 * Does not cover damage-type immunity alone (no `condition-*` tag).
 */
export function inferRarityFromConditionImmunityTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:immunity")) return null;
  const hasNamedCondition = [...set].some((tag) =>
    tag.startsWith("mechanic:condition-"),
  );
  if (!hasNamedCondition) return null;
  return INLINE_CONDITION_IMMUNITY_RARITY;
}
