import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { combatReducer } from "./combat-reducer";
import type { Combatant, CombatState } from "./combat-tracker.types";
import {
  createEmptyCombatState,
  EMPTY_DEATH_SAVES,
} from "./combat-tracker.types";
import { getCombatantStatus } from "./combatant-status.utils";

function makeCombatant(
  id: string,
  initiative: number,
  overrides: Partial<Combatant> = {},
): Combatant {
  return {
    id,
    kind: "npc",
    name: id,
    hp: { current: 10, max: 10, temp: 0 },
    ac: 12,
    levelOrCr: "1",
    initiative,
    initiativeMod: 0,
    dexScore: 10,
    deathSaves: { ...EMPTY_DEATH_SAVES },
    ...overrides,
  };
}

describe("combatReducer", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // d20 = 11
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips defeated NPCs and dead PCs on NEXT_TURN", () => {
    const a = makeCombatant("a", 20);
    const b = makeCombatant("b", 15, {
      hp: { current: 0, max: 10, temp: 0 },
    });
    const c = makeCombatant("c", 10);
    let state: CombatState = {
      ...createEmptyCombatState(),
      combatants: [a, b, c],
      started: true,
      activeId: "a",
      round: 1,
    };

    state = combatReducer(state, { type: "NEXT_TURN" });
    expect(state.activeId).toBe("c");
    expect(state.round).toBe(1);
  });

  it("increments round when wrapping to the top of the list", () => {
    const a = makeCombatant("a", 20);
    const c = makeCombatant("c", 10);
    let state: CombatState = {
      ...createEmptyCombatState(),
      combatants: [a, c],
      started: true,
      activeId: "c",
      round: 1,
    };

    state = combatReducer(state, { type: "NEXT_TURN" });
    expect(state.activeId).toBe("a");
    expect(state.round).toBe(2);
  });

  it("keeps activeId when inserting mid-combat", () => {
    const a = makeCombatant("a", 20);
    const c = makeCombatant("c", 10);
    let state: CombatState = {
      ...createEmptyCombatState(),
      combatants: [a, c],
      started: true,
      activeId: "a",
      round: 1,
    };

    const mid = makeCombatant("mid", 15);
    state = combatReducer(state, { type: "ADD", combatant: mid });
    expect(state.activeId).toBe("a");
    expect(state.combatants).toHaveLength(3);
  });

  it("does not skip dying PCs", () => {
    const a = makeCombatant("a", 20, { kind: "pc", name: "PC A" });
    const dying = makeCombatant("dying", 15, {
      kind: "pc",
      name: "PC Dying",
      hp: { current: 0, max: 20, temp: 0 },
    });
    expect(getCombatantStatus(dying)).toBe("dying");

    let state: CombatState = {
      ...createEmptyCombatState(),
      combatants: [a, dying],
      started: true,
      activeId: "a",
      round: 1,
    };

    state = combatReducer(state, { type: "NEXT_TURN" });
    expect(state.activeId).toBe("dying");
  });

  it("applies death save nat 20 via ROLL_DEATH_SAVE when random is high", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // d20 = 20
    const pc = makeCombatant("pc", 10, {
      kind: "pc",
      hp: { current: 0, max: 20, temp: 0 },
      deathSaves: { successes: 1, failures: 1 },
    });
    let state: CombatState = {
      ...createEmptyCombatState(),
      combatants: [pc],
    };
    state = combatReducer(state, { type: "ROLL_DEATH_SAVE", id: "pc" });
    const updated = state.combatants[0];
    expect(updated.hp.current).toBe(1);
    expect(updated.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(updated.lastDeathSaveRoll).toBe(20);
  });

  it("applies death save nat 1 as two failures", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // d20 = 1
    const pc = makeCombatant("pc", 10, {
      kind: "pc",
      hp: { current: 0, max: 20, temp: 0 },
    });
    let state: CombatState = {
      ...createEmptyCombatState(),
      combatants: [pc],
    };
    state = combatReducer(state, { type: "ROLL_DEATH_SAVE", id: "pc" });
    expect(state.combatants[0].deathSaves.failures).toBe(2);
    expect(state.combatants[0].lastDeathSaveRoll).toBe(1);
  });

  it("END_COMBAT clears state", () => {
    const state = combatReducer(
      {
        ...createEmptyCombatState(),
        combatants: [makeCombatant("a", 10)],
        started: true,
        round: 3,
        activeId: "a",
      },
      { type: "END_COMBAT" },
    );
    expect(state).toEqual(createEmptyCombatState());
  });
});
