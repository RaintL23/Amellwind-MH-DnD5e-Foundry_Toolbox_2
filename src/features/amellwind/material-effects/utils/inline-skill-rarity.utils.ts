import type { ResourceRarity } from "@/shared/types";
import { INLINE_SKILL_UTILITY_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Common for mild always-on skill / contest utility:
 * - flat `skill-bonus` (e.g. +2 Athletics / Climb checks)
 * - `advantage` on a named skill or against being disarmed
 */
export function inferRarityFromSkillUtilityTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (set.has("mechanic:skill-bonus")) return INLINE_SKILL_UTILITY_RARITY;

  if (!set.has("mechanic:advantage")) return null;

  const hasSkill = [...set].some((tag) => tag.startsWith("mechanic:skill-"));
  if (hasSkill || set.has("mechanic:disarm")) {
    return INLINE_SKILL_UTILITY_RARITY;
  }

  return null;
}
