import { describe, expect, it } from "vitest";
import { applyHpChange } from "./hp.utils";
import type { Combatant } from "./combat-tracker.types";
import { EMPTY_DEATH_SAVES } from "./combat-tracker.types";

function makePc(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: "pc-1",
    kind: "pc",
    name: "Fighter",
    hp: { current: 20, max: 20, temp: 0 },
    ac: 16,
    levelOrCr: "Lv 5",
    initiative: 12,
    initiativeMod: 2,
    dexScore: 14,
    deathSaves: { ...EMPTY_DEATH_SAVES },
    ...overrides,
  };
}

function makeNpc(overrides: Partial<Combatant> = {}): Combatant {
  return {
    ...makePc({ id: "npc-1", kind: "npc", name: "Goblin", levelOrCr: "1/4" }),
    ...overrides,
    kind: "npc",
  };
}

describe("applyHpChange", () => {
  it("applies damage through temp HP first", () => {
    const result = applyHpChange(
      makePc({ hp: { current: 20, max: 20, temp: 5 } }),
      -8,
    );
    expect(result.hp).toEqual({ current: 17, max: 20, temp: 0 });
  });

  it("heals up to max and clears death saves when leaving 0", () => {
    const result = applyHpChange(
      makePc({
        hp: { current: 0, max: 20, temp: 0 },
        deathSaves: { successes: 1, failures: 2 },
      }),
      5,
    );
    expect(result.hp.current).toBe(5);
    expect(result.deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it("does not stack temp HP (takes the higher value)", () => {
    const result = applyHpChange(
      makePc({ hp: { current: 20, max: 20, temp: 5 } }),
      0,
      { setTempHp: 3 },
    );
    expect(result.hp.temp).toBe(5);

    const raised = applyHpChange(
      makePc({ hp: { current: 20, max: 20, temp: 5 } }),
      0,
      { setTempHp: 8 },
    );
    expect(raised.hp.temp).toBe(8);
  });

  it("marks PC dead on massive damage", () => {
    const result = applyHpChange(
      makePc({ hp: { current: 5, max: 20, temp: 0 } }),
      -30,
    );
    expect(result.hp.current).toBe(0);
    expect(result.deathSaves.failures).toBe(3);
  });

  it("adds death save failures when damaging a PC at 0 HP", () => {
    const normal = applyHpChange(
      makePc({ hp: { current: 0, max: 20, temp: 0 } }),
      -5,
    );
    expect(normal.deathSaves.failures).toBe(1);

    const crit = applyHpChange(
      makePc({ hp: { current: 0, max: 20, temp: 0 } }),
      -5,
      { critical: true },
    );
    expect(crit.deathSaves.failures).toBe(2);
  });

  it("defeats NPCs at 0 without death saves", () => {
    const result = applyHpChange(
      makeNpc({ hp: { current: 7, max: 7, temp: 0 } }),
      -10,
    );
    expect(result.hp.current).toBe(0);
    expect(result.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});
