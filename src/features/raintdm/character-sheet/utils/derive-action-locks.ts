import type { AbilityKey } from "@/shared/types";
import type { ActionLocks } from "./condition-effects.data";
export {
  deriveActionLocks,
  exhaustionEffects,
  exhaustionLevelSummary,
  lookupConditionEffects,
  resolveInstanceEffects,
} from "./condition-effects.data";
export type { ActionLocks } from "./condition-effects.data";

import type { RollMode } from "./play-character.types";

export type SheetRollKind = "attack" | "check" | "save" | "init" | "death";

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

/** Forced disadvantage for a d20 test kind (exhaustion / conditions). */
export function forcedDisadvantageForKind(
  kind: SheetRollKind,
  locks: ActionLocks,
  ability?: AbilityKey,
): boolean {
  if (kind === "attack") {
    return locks.attackDisadvantage || locks.d20TestDisadvantage;
  }
  if (kind === "check" || kind === "init") {
    return locks.abilityCheckDisadvantage || locks.d20TestDisadvantage;
  }
  // save / death: saving-throw disadvantage + flat D20 Test disadvantage only
  // (not ability-check disadvantage from Exhaustion 2014 level 1)
  const saveDis = locks.savingThrowDisadvantage;
  const saveForced =
    saveDis === "all" ||
    (ability != null && Array.isArray(saveDis) && saveDis.includes(ability));
  return saveForced || locks.d20TestDisadvantage;
}

export function rollModeForKind(
  userMode: RollMode,
  kind: SheetRollKind,
  locks: ActionLocks,
  ability?: AbilityKey,
): RollMode {
  return resolveEffectiveRollMode(
    userMode,
    forcedDisadvantageForKind(kind, locks, ability),
  );
}

export function attackRollMode(
  userMode: RollMode,
  locks: ActionLocks,
): RollMode {
  return rollModeForKind(userMode, "attack", locks);
}

export function checkRollMode(
  userMode: RollMode,
  locks: ActionLocks,
): RollMode {
  return rollModeForKind(userMode, "check", locks);
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
