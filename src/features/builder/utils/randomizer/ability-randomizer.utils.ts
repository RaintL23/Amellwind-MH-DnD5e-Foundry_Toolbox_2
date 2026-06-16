import type { AbilityKey, AbilityScores } from "@/shared/types";
import {
  ABILITY_KEYS,
  defaultPointBuyScores,
  rollSixAbilityScores,
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

/**
 * Assign rolled scores using explicit priority order.
 * The highest roll goes to priority[0] (primary stat), then descending.
 */
export function assignRolledAbilityScores(
  rolled: number[],
  abilityPriority: AbilityKey[],
): Partial<AbilityScores> {
  const sorted = [...rolled].sort((a, b) => b - a);
  const priority =
    abilityPriority.length > 0
      ? abilityPriority
      : [...ABILITY_KEYS];

  const result: Partial<AbilityScores> = {};
  priority.forEach((ability, index) => {
    if (index < sorted.length) {
      result[ability] = sorted[index];
    }
  });
  return result;
}

export function rollAndAssignAbilityScores(
  abilityPriority: AbilityKey[],
  heroic = false,
): Partial<AbilityScores> {
  return assignRolledAbilityScores(
    rollSixAbilityScores(heroic),
    abilityPriority,
  );
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
