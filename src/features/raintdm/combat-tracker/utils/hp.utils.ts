import type { Combatant, DeathSaves } from "./combat-tracker.types";
import { EMPTY_DEATH_SAVES } from "./combat-tracker.types";

export interface ApplyHpChangeOptions {
  /** Extra death-save failures when damaging a PC already at 0 HP (RAW: crit = 2). */
  critical?: boolean;
  /** Set temp HP to this value (max of current and new — RAW no stacking). */
  setTempHp?: number;
}

/**
 * Apply damage (negative delta), healing (positive), and optional temp HP.
 * Implements PHB death/massive-damage rules for PCs.
 */
export function applyHpChange(
  combatant: Combatant,
  delta: number,
  opts: ApplyHpChangeOptions = {},
): Combatant {
  let { current, temp } = combatant.hp;
  const { max } = combatant.hp;
  let deathSaves: DeathSaves = { ...combatant.deathSaves };
  const wasAtZero = current <= 0;

  if (opts.setTempHp != null && opts.setTempHp >= 0) {
    temp = Math.max(temp, Math.floor(opts.setTempHp));
  }

  if (delta === 0) {
    return {
      ...combatant,
      hp: { current, max, temp },
      deathSaves,
    };
  }

  if (delta > 0) {
    // Healing
    current = Math.min(max, current + delta);
    if (wasAtZero && current > 0) {
      deathSaves = { ...EMPTY_DEATH_SAVES };
    }
    return {
      ...combatant,
      hp: { current, max, temp },
      deathSaves,
      lastDeathSaveRoll: current > 0 ? undefined : combatant.lastDeathSaveRoll,
    };
  }

  // Damage (delta < 0)
  let remaining = -delta;

  if (wasAtZero && combatant.kind === "pc") {
    const failAdd = opts.critical ? 2 : 1;
    deathSaves = {
      ...deathSaves,
      failures: Math.min(3, deathSaves.failures + failAdd),
    };
    return {
      ...combatant,
      hp: { current: 0, max, temp: 0 },
      deathSaves,
    };
  }

  // Absorb through temp HP first
  if (temp > 0) {
    const absorbed = Math.min(temp, remaining);
    temp -= absorbed;
    remaining -= absorbed;
  }

  if (remaining <= 0) {
    return {
      ...combatant,
      hp: { current, max, temp },
      deathSaves,
    };
  }

  const hpBefore = current;
  current = Math.max(0, current - remaining);
  const overflow = remaining - hpBefore;

  if (current === 0 && combatant.kind === "pc") {
    // Massive damage: leftover >= max HP → instant death
    if (overflow >= max) {
      deathSaves = { successes: 0, failures: 3 };
    } else {
      deathSaves = { ...EMPTY_DEATH_SAVES };
    }
  }

  if (combatant.kind === "npc" && current === 0) {
    deathSaves = { ...EMPTY_DEATH_SAVES };
  }

  return {
    ...combatant,
    hp: { current, max, temp },
    deathSaves,
  };
}
