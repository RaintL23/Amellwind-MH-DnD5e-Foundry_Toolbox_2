import type { AbilityKey, AbilityScores } from "@/shared/types";
import { ABILITY_KEYS, rollSixAbilityScores } from "../ability-scores";

/** Assign rolled scores prioritizing class saving-throw abilities. */
export function assignRolledAbilityScores(
  rolled: number[],
  saveProficiencies: AbilityKey[],
): Partial<AbilityScores> {
  const sorted = [...rolled].sort((a, b) => b - a);
  const priority: AbilityKey[] = [
    ...saveProficiencies,
    ...ABILITY_KEYS.filter((key) => !saveProficiencies.includes(key)),
  ];

  const result: Partial<AbilityScores> = {};
  priority.forEach((ability, index) => {
    if (index < sorted.length) {
      result[ability] = sorted[index];
    }
  });
  return result;
}

export function rollAndAssignAbilityScores(
  saveProficiencies: AbilityKey[],
  heroic = false,
): Partial<AbilityScores> {
  return assignRolledAbilityScores(
    rollSixAbilityScores(heroic),
    saveProficiencies,
  );
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
