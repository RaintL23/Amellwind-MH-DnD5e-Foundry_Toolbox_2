import { describe, expect, it } from "vitest";
import { withTiebreaker, sortByInitiative } from "./initiative.utils";
import type { Combatant } from "./combat-tracker.types";
import { EMPTY_DEATH_SAVES } from "./combat-tracker.types";

function c(
  id: string,
  initiative: number | null,
): Combatant {
  return {
    id,
    kind: "npc",
    name: id,
    hp: { current: 1, max: 1, temp: 0 },
    ac: 10,
    levelOrCr: "0",
    initiative,
    initiativeMod: 0,
    dexScore: 10,
    deathSaves: { ...EMPTY_DEATH_SAVES },
  };
}

describe("initiative.utils", () => {
  it("applies Foundry Dex/100 tiebreaker", () => {
    expect(withTiebreaker(15, 14)).toBe(15.14);
    expect(withTiebreaker(10, 8)).toBe(10.08);
  });

  it("sorts descending and puts null last", () => {
    const sorted = sortByInitiative([c("a", 10), c("b", null), c("c", 15)]);
    expect(sorted.map((x) => x.id)).toEqual(["c", "a", "b"]);
  });
});
