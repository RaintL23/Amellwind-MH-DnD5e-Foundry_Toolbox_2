import type { Combatant, DeathSaves } from "./combat-tracker.types";
import { EMPTY_DEATH_SAVES } from "./combat-tracker.types";
import {
  applyHpChangeToActor,
  type ApplyHpChangeOptions,
} from "@/shared/utils/hp-actor.utils";

export type { ApplyHpChangeOptions };

/**
 * Apply damage (negative delta), healing (positive), and optional temp HP.
 * Implements PHB death/massive-damage rules for PCs.
 */
export function applyHpChange(
  combatant: Combatant,
  delta: number,
  opts: ApplyHpChangeOptions = {},
): Combatant {
  const result = applyHpChangeToActor(
    {
      kind: combatant.kind,
      hp: combatant.hp,
      deathSaves: combatant.deathSaves,
    },
    delta,
    opts,
  );

  const deathSaves: DeathSaves = result.deathSaves;
  const healedFromZero =
    combatant.hp.current <= 0 && result.hp.current > 0;

  return {
    ...combatant,
    hp: result.hp,
    deathSaves: healedFromZero ? { ...EMPTY_DEATH_SAVES } : deathSaves,
    lastDeathSaveRoll:
      result.hp.current > 0 ? undefined : combatant.lastDeathSaveRoll,
  };
}
