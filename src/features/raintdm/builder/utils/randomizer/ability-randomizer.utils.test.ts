import { describe, expect, it } from "vitest";
import { pointBuyRemaining } from "@/shared/utils/ability-scores";
import {
  assignValuesByPriority,
  buildClassPointBuyScores,
} from "./ability-randomizer.utils";

describe("assignValuesByPriority", () => {
  it("gives the highest values to the first priorities, regardless of input order", () => {
    expect(
      assignValuesByPriority([8, 15, 10, 14, 12, 13], [
        "int",
        "con",
        "dex",
        "wis",
        "cha",
        "str",
      ]),
    ).toEqual({ int: 15, con: 14, dex: 13, wis: 12, cha: 10, str: 8 });
  });

  it("leaves abilities unassigned when there are fewer values than priorities", () => {
    expect(assignValuesByPriority([16, 9], ["str", "con", "dex"])).toEqual({
      str: 16,
      con: 9,
    });
  });
});

describe("buildClassPointBuyScores", () => {
  it("spends the full point-buy budget for a full priority list", () => {
    const scores = buildClassPointBuyScores([
      "dex",
      "wis",
      "con",
      "str",
      "int",
      "cha",
    ]);
    expect(scores.dex).toBe(15);
    expect(scores.wis).toBe(14);
    expect(pointBuyRemaining(scores)).toBe(0);
  });
});
