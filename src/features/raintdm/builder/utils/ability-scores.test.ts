import { describe, expect, it } from "vitest";
import type { AbilityScores } from "@/shared/types";
import {
  STANDARD_ARRAY,
  defaultPointBuyScores,
  poolAssignmentsToScores,
  poolStateFromScores,
} from "./ability-scores";

describe("poolStateFromScores", () => {
  it("restores every pick when scores are a full standard-array permutation", () => {
    const scores: AbilityScores = { str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 };
    const { assignments, pool } = poolStateFromScores(scores, STANDARD_ARRAY);
    expect(assignments).toEqual(scores);
    expect(pool).toEqual([]);
  });

  it("leaves 8s unassigned on a partial assignment", () => {
    const scores: AbilityScores = { str: 15, dex: 14, con: 8, int: 8, wis: 8, cha: 8 };
    const { assignments, pool } = poolStateFromScores(scores, STANDARD_ARRAY);
    expect(assignments).toEqual({ str: 15, dex: 14 });
    expect(pool).toEqual([13, 12, 10, 8]);
  });

  it("assigns nothing for the all-8 initial state", () => {
    const { assignments, pool } = poolStateFromScores(
      defaultPointBuyScores(),
      STANDARD_ARRAY,
    );
    expect(assignments).toEqual({});
    expect(pool).toEqual([...STANDARD_ARRAY]);
  });

  it("skips scores that are not in the source pool", () => {
    const scores: AbilityScores = { str: 17, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
    const { assignments, pool } = poolStateFromScores(scores, STANDARD_ARRAY);
    expect(assignments).toEqual({ dex: 14, con: 13, int: 12, wis: 10 });
    expect(pool).toEqual([15, 8]);
  });
});

describe("poolAssignmentsToScores", () => {
  it("fills unassigned abilities with 8", () => {
    expect(poolAssignmentsToScores({ str: 15 })).toEqual({
      ...defaultPointBuyScores(),
      str: 15,
    });
  });
});
