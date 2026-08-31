import { describe, expect, it } from "vitest";
import { inferRarityFromCosmeticTags } from "./inline-cosmetic-rarity.utils";

describe("inferRarityFromCosmeticTags", () => {
  it("assigns Common to cosmetic effects", () => {
    expect(
      inferRarityFromCosmeticTags(["type:cosmetic", "mechanic:passive"]),
    ).toBe("Common");
  });

  it("returns null without the cosmetic tag", () => {
    expect(inferRarityFromCosmeticTags(["mechanic:passive"])).toBeNull();
  });
});
