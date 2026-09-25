import type { Combatant, DeathSaves } from "./combat-tracker.types";
import { EMPTY_DEATH_SAVES } from "./combat-tracker.types";

export type DeathSaveOutcome =
  | { kind: "nat20"; combatant: Combatant }
  | { kind: "nat1"; combatant: Combatant }
  | { kind: "success"; combatant: Combatant }
  | { kind: "failure"; combatant: Combatant };

function clampSaves(saves: DeathSaves): DeathSaves {
  return {
    successes: Math.min(3, Math.max(0, saves.successes)),
    failures: Math.min(3, Math.max(0, saves.failures)),
  };
}

/** Apply a death saving throw roll (RAW PHB). */
export function resolveDeathSave(
  combatant: Combatant,
  d20: number,
): DeathSaveOutcome {
  const withRoll = { ...combatant, lastDeathSaveRoll: d20 };

  if (d20 === 20) {
    return {
      kind: "nat20",
      combatant: {
        ...withRoll,
        hp: { ...withRoll.hp, current: Math.max(1, withRoll.hp.current) },
        deathSaves: { ...EMPTY_DEATH_SAVES },
      },
    };
  }

  if (d20 === 1) {
    const failures = Math.min(3, withRoll.deathSaves.failures + 2);
    return {
      kind: "nat1",
      combatant: {
        ...withRoll,
        deathSaves: clampSaves({
          ...withRoll.deathSaves,
          failures,
        }),
      },
    };
  }

  if (d20 >= 10) {
    return {
      kind: "success",
      combatant: {
        ...withRoll,
        deathSaves: clampSaves({
          ...withRoll.deathSaves,
          successes: withRoll.deathSaves.successes + 1,
        }),
      },
    };
  }

  return {
    kind: "failure",
    combatant: {
      ...withRoll,
      deathSaves: clampSaves({
        ...withRoll.deathSaves,
        failures: withRoll.deathSaves.failures + 1,
      }),
    },
  };
}

export function toggleDeathSaveCount(
  current: number,
  checked: boolean,
): number {
  if (checked) return Math.min(3, current + 1);
  return Math.max(0, current - 1);
}

/** Set success/failure count directly (0–3) from checkbox UI. */
export function setDeathSaveCount(
  combatant: Combatant,
  side: "successes" | "failures",
  count: number,
): Combatant {
  return {
    ...combatant,
    deathSaves: clampSaves({
      ...combatant.deathSaves,
      [side]: count,
    }),
  };
}
