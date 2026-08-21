import { describe, expect, it } from "vitest";
import { inferRarityFromHoldBreathUnderwaterTags } from "./inline-hold-breath-rarity.utils";

describe("inferRarityFromHoldBreathUnderwaterTags", () => {
  it("assigns Common for hold-breath + underwater", () => {
    expect(
      inferRarityFromHoldBreathUnderwaterTags([
        "mechanic:hold-breath",
        "mechanic:underwater",
        "mechanic:passive",
      ]),
    ).toBe("Common");
  });

  it("returns null without hold-breath", () => {
    expect(
      inferRarityFromHoldBreathUnderwaterTags([
        "mechanic:underwater",
        "mechanic:passive",
      ]),
    ).toBeNull();
  });

  it("returns null without underwater", () => {
    expect(
      inferRarityFromHoldBreathUnderwaterTags([
        "mechanic:hold-breath",
        "mechanic:passive",
      ]),
    ).toBeNull();
  });
});
