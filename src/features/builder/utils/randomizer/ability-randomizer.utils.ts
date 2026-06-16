import type { AbilityKey, AbilityScores } from "@/shared/types";
import { ABILITY_KEYS, rollSixAbilityScores } from "../ability-scores";

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
