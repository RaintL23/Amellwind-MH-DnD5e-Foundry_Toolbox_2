import { describe, expect, it } from "vitest";
import { inferRarityFromEndDotTags } from "./inline-end-dot-rarity.utils";

describe("inferRarityFromEndDotTags", () => {
  it("assigns Rare when end-dot is present", () => {
    expect(inferRarityFromEndDotTags(["mechanic:end-dot"])).toBe("Rare");
  });

  it("returns null without end-dot", () => {
    expect(inferRarityFromEndDotTags(["mechanic:passive"])).toBeNull();
  });
});
