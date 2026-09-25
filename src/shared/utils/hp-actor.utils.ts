/**
 * Shared HP / death-save helpers used by Combat Tracker and Character Sheet.
 */
export interface HpBlock {
  current: number;
  max: number;
  temp: number;
}

export interface DeathSavesBlock {
  successes: number;
  failures: number;
}

export const EMPTY_DEATH_SAVES_BLOCK: DeathSavesBlock = {
  successes: 0,
  failures: 0,
};

export interface HpActorLike {
  kind: "pc" | "npc";
  hp: HpBlock;
  deathSaves: DeathSavesBlock;
}

export interface ApplyHpChangeOptions {
  critical?: boolean;
  setTempHp?: number;
}

export function applyHpChangeToActor<T extends HpActorLike>(
  actor: T,
  delta: number,
  opts: ApplyHpChangeOptions = {},
): T {
  let { current, temp } = actor.hp;
  const { max } = actor.hp;
  let deathSaves: DeathSavesBlock = { ...actor.deathSaves };
  const wasAtZero = current <= 0;

  if (opts.setTempHp != null && opts.setTempHp >= 0) {
    temp = Math.max(temp, Math.floor(opts.setTempHp));
  }

  if (delta === 0) {
    return {
      ...actor,
      hp: { current, max, temp },
      deathSaves,
    };
  }

  if (delta > 0) {
    current = Math.min(max, current + delta);
    if (wasAtZero && current > 0) {
      deathSaves = { ...EMPTY_DEATH_SAVES_BLOCK };
    }
    return {
      ...actor,
      hp: { current, max, temp },
      deathSaves,
    };
  }

  let remaining = -delta;

  if (wasAtZero && actor.kind === "pc") {
    const failAdd = opts.critical ? 2 : 1;
    deathSaves = {
      ...deathSaves,
      failures: Math.min(3, deathSaves.failures + failAdd),
    };
    return {
      ...actor,
      hp: { current: 0, max, temp: 0 },
      deathSaves,
    };
  }

  if (temp > 0) {
    const absorbed = Math.min(temp, remaining);
    temp -= absorbed;
    remaining -= absorbed;
  }

  if (remaining <= 0) {
    return {
      ...actor,
      hp: { current, max, temp },
      deathSaves,
    };
  }

  const hpBefore = current;
  current = Math.max(0, current - remaining);
  const overflow = remaining - hpBefore;

  if (current === 0 && actor.kind === "pc") {
    if (overflow >= max) {
      deathSaves = { successes: 0, failures: 3 };
    } else {
      deathSaves = { ...EMPTY_DEATH_SAVES_BLOCK };
    }
  }

  if (actor.kind === "npc" && current === 0) {
    deathSaves = { ...EMPTY_DEATH_SAVES_BLOCK };
  }

  return {
    ...actor,
    hp: { current, max, temp },
    deathSaves,
  };
}

export type DeathSaveOutcomeKind = "nat20" | "nat1" | "success" | "failure";

export interface DeathSaveResult<T extends HpActorLike> {
  kind: DeathSaveOutcomeKind;
  actor: T;
}

function clampSaves(saves: DeathSavesBlock): DeathSavesBlock {
  return {
    successes: Math.min(3, Math.max(0, saves.successes)),
    failures: Math.min(3, Math.max(0, saves.failures)),
  };
}

export function resolveDeathSaveForActor<T extends HpActorLike>(
  actor: T,
  d20: number,
): DeathSaveResult<T> {
  if (d20 === 20) {
    return {
      kind: "nat20",
      actor: {
        ...actor,
        hp: { ...actor.hp, current: Math.max(1, actor.hp.current) },
        deathSaves: { ...EMPTY_DEATH_SAVES_BLOCK },
      },
    };
  }

  if (d20 === 1) {
    return {
      kind: "nat1",
      actor: {
        ...actor,
        deathSaves: clampSaves({
          ...actor.deathSaves,
          failures: actor.deathSaves.failures + 2,
        }),
      },
    };
  }

  if (d20 >= 10) {
    return {
      kind: "success",
      actor: {
        ...actor,
        deathSaves: clampSaves({
          ...actor.deathSaves,
          successes: actor.deathSaves.successes + 1,
        }),
      },
    };
  }

  return {
    kind: "failure",
    actor: {
      ...actor,
      deathSaves: clampSaves({
        ...actor.deathSaves,
        failures: actor.deathSaves.failures + 1,
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

export function setDeathSaveCountOnActor<T extends HpActorLike>(
  actor: T,
  side: "successes" | "failures",
  count: number,
): T {
  return {
    ...actor,
    deathSaves: clampSaves({
      ...actor.deathSaves,
      [side]: count,
    }),
  };
}
