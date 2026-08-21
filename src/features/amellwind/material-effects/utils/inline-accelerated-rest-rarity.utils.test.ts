import { describe, expect, it } from "vitest";
import { inferRarityFromAcceleratedRestTags } from "./inline-accelerated-rest-rarity.utils";

describe("inferRarityFromAcceleratedRestTags", () => {
  it("assigns Uncommon for accelerated-rest", () => {
    expect(
      inferRarityFromAcceleratedRestTags([
        "mechanic:accelerated-rest",
        "mechanic:long-rest",
        "mechanic:passive",
      ]),
    ).toBe("Uncommon");
  });

  it("returns null for long-rest recharge gates without accelerated-rest", () => {
    expect(
      inferRarityFromAcceleratedRestTags([
        "mechanic:long-rest",
        "mechanic:bonus-action",
        "mechanic:active",
      ]),
    ).toBeNull();
  });
});
