import type { AbilityKey, AbilityScores } from "@/shared/types";
import {
  ABILITY_KEYS,
  defaultPointBuyScores,
} from "@/shared/utils/ability-scores";

/** Optimal 27-point-buy spread (same total as the standard array). */
const CLASS_POINT_BUY_TEMPLATE = [15, 14, 13, 12, 10, 8] as const;

/** Highest value to the first ability in `priority`, next highest to the second, … */
export function assignValuesByPriority(
  values: readonly number[],
  priority: readonly AbilityKey[],
): Partial<Record<AbilityKey, number>> {
  const sorted = [...values].sort((a, b) => b - a);
  const assigned: Partial<Record<AbilityKey, number>> = {};
  priority.forEach((ability, index) => {
    const value = sorted[index];
    if (value !== undefined) assigned[ability] = value;
  });
  return assigned;
}

/**
 * Distribute the full point-buy budget using class ability priority:
 * primary casting stat → saving throws → remaining abilities.
 */
export function buildClassPointBuyScores(
  abilityPriority: AbilityKey[],
): AbilityScores {
  const priority =
    abilityPriority.length > 0 ? abilityPriority : [...ABILITY_KEYS];
  return {
    ...defaultPointBuyScores(),
    ...assignValuesByPriority(CLASS_POINT_BUY_TEMPLATE, priority),
  };
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
