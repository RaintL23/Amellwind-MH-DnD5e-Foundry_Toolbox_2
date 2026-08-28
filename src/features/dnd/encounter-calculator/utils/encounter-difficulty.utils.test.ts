import { describe, expect, it } from "vitest";
import { getEncounterDifficulty } from "./encounter-difficulty.utils";

describe("getEncounterDifficulty", () => {
  it("rates encounter at or above medium budget", () => {
    const result = getEncounterDifficulty(
      [5, 5, 5, 5],
      [{ id: "1", name: "Mage", cr: "6", count: 1 }],
    );
    expect(result.rating).toBe("medium");
    expect(result.adjustedXp).toBe(2300);
    expect(result.budget.medium).toBe(2000);
  });

  it("applies monster count multiplier", () => {
    const result = getEncounterDifficulty(
      [5, 5, 5, 5],
      [{ id: "1", name: "Bandit", cr: "1/8", count: 4 }],
    );
    expect(result.multiplier).toBe(2);
    expect(result.adjustedXp).toBe(200);
  });
});
