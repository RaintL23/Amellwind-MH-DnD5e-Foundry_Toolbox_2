import { describe, expect, it } from "vitest";
import { inferRarityFromGatherResourceTags } from "./inline-gather-rarity.utils";

describe("inferRarityFromGatherResourceTags", () => {
  it("assigns Uncommon for base gather-resources", () => {
    expect(
      inferRarityFromGatherResourceTags([
        "mechanic:gather-resources",
        "mechanic:fishing",
        "mechanic:passive",
      ]),
    ).toBe("Uncommon");
  });

  it("assigns Rare for gather-resources:major", () => {
    expect(
      inferRarityFromGatherResourceTags([
        "mechanic:gather-resources",
        "mechanic:gather-resources:major",
        "mechanic:mining",
      ]),
    ).toBe("Rare");
  });

  it("returns null without gather tags", () => {
    expect(
      inferRarityFromGatherResourceTags(["mechanic:fishing"]),
    ).toBeNull();
  });
});
