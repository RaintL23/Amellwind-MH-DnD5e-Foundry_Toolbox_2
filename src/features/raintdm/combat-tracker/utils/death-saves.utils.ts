import type { Combatant, DeathSaves } from "./combat-tracker.types";
import {
  resolveDeathSaveForActor,
  setDeathSaveCountOnActor,
  toggleDeathSaveCount as sharedToggle,
} from "@/shared/utils/hp-actor.utils";

export type DeathSaveOutcome =
  | { kind: "nat20"; combatant: Combatant }
  | { kind: "nat1"; combatant: Combatant }
  | { kind: "success"; combatant: Combatant }
  | { kind: "failure"; combatant: Combatant };

/** Apply a death saving throw roll (RAW PHB). */
export function resolveDeathSave(
  combatant: Combatant,
  d20: number,
): DeathSaveOutcome {
  const { kind, actor } = resolveDeathSaveForActor(
    {
      kind: combatant.kind,
      hp: combatant.hp,
      deathSaves: combatant.deathSaves,
    },
    d20,
  );

  return {
    kind,
    combatant: {
      ...combatant,
      hp: actor.hp,
      deathSaves: actor.deathSaves as DeathSaves,
      lastDeathSaveRoll: d20,
    },
  };
}

export const toggleDeathSaveCount = sharedToggle;

/** Set success/failure count directly (0–3) from checkbox UI. */
export function setDeathSaveCount(
  combatant: Combatant,
  side: "successes" | "failures",
  count: number,
): Combatant {
  const actor = setDeathSaveCountOnActor(
    {
      kind: combatant.kind,
      hp: combatant.hp,
      deathSaves: combatant.deathSaves,
    },
    side,
    count,
  );
  return {
    ...combatant,
    deathSaves: actor.deathSaves as DeathSaves,
  };
}
