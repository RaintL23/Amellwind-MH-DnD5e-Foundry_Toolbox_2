import { describe, expect, it } from "vitest";
import { resolveFindingSignsRoll } from "./hunt-roll.utils";

describe("resolveFindingSignsRoll", () => {
  it("uses manual roll when provided", () => {
    const result = resolveFindingSignsRoll(true, 0, { manualRoll: 18 });
    expect(result.rawRoll).toBe(18);
    expect(result.adjustedRoll).toBe(18);
    expect(result.signs).toBe(1);
  });

  it("clamps manual roll to die sides", () => {
    const fail = resolveFindingSignsRoll(false, 0, { manualRoll: 15 });
    expect(fail.dieSides).toBe(10);
    expect(fail.rawRoll).toBe(10);
  });

  it("applies flat bonus after manual roll", () => {
    const result = resolveFindingSignsRoll(true, 2, { manualRoll: 16 });
    expect(result.adjustedRoll).toBe(18);
    expect(result.event).toBe("sign");
  });
});
