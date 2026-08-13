import type { AbilityKey, AbilityScores } from "@/shared/types";
import {
  ABILITY_KEYS,
  defaultPointBuyScores,
} from "../ability-scores";

/** Optimal 27-point-buy spread (same total as the standard array). */
const CLASS_POINT_BUY_TEMPLATE = [15, 14, 13, 12, 10, 8] as const;

/**
 * Distribute the full point-buy budget using class ability priority:
 * primary casting stat → saving throws → remaining abilities.
 */
export function buildClassPointBuyScores(
  abilityPriority: AbilityKey[],
): AbilityScores {
  const scores = defaultPointBuyScores();
  const priority =
    abilityPriority.length > 0 ? abilityPriority : [...ABILITY_KEYS];

  priority.forEach((ability, index) => {
    const templateScore = CLASS_POINT_BUY_TEMPLATE[index];
    if (templateScore !== undefined) {
      scores[ability] = templateScore;
    }
  });

  return scores;
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
