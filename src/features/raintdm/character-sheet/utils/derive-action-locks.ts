import type {
  ActionLocks,
} from "./condition-effects.data";
export {
  deriveActionLocks,
  exhaustionEffects,
  exhaustionLevelSummary,
  lookupConditionEffects,
  resolveInstanceEffects,
} from "./condition-effects.data";
export type { ActionLocks } from "./condition-effects.data";

import type { RollMode } from "./play-character.types";

/**
 * Combine user roll mode with condition-forced disadvantage.
 * Advantage + disadvantage cancel to normal (PHB).
 */
export function resolveEffectiveRollMode(
  userMode: RollMode,
  forcedDisadvantage: boolean,
  forcedAdvantage = false,
): RollMode {
  const adv = userMode === "advantage" || forcedAdvantage;
  const dis = userMode === "disadvantage" || forcedDisadvantage;
  if (adv && dis) return "normal";
  if (adv) return "advantage";
  if (dis) return "disadvantage";
  return "normal";
}

export function attackRollMode(
  userMode: RollMode,
  locks: ActionLocks,
): RollMode {
  return resolveEffectiveRollMode(
    userMode,
    locks.attackDisadvantage || locks.d20TestDisadvantage,
  );
}

export function checkRollMode(
  userMode: RollMode,
  locks: ActionLocks,
): RollMode {
  return resolveEffectiveRollMode(
    userMode,
    locks.abilityCheckDisadvantage || locks.d20TestDisadvantage,
  );
}

/**
 * Apply flat D20 Test penalties (e.g. 2024 Exhaustion −2 × level).
 * Append `detailSuffix` before the final `= total` in the roll log.
 */
export function applyD20TestPenalty(
  baseTotal: number,
  locks: ActionLocks,
): { total: number; detailSuffix: string } {
  const penalty = locks.d20TestPenalty ?? 0;
  if (penalty <= 0) return { total: baseTotal, detailSuffix: "" };
  return {
    total: baseTotal - penalty,
    detailSuffix: ` −${penalty} exh`,
  };
}
