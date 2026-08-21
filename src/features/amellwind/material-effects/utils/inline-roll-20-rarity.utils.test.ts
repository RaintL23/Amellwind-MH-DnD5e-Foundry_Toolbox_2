import { describe, expect, it } from "vitest";
import { inferRarityFromRoll20UtilityTags } from "./inline-roll-20-rarity.utils";

describe("inferRarityFromRoll20UtilityTags", () => {
  it("assigns Common to a nat-20 push with no damage", () => {
    expect(
      inferRarityFromRoll20UtilityTags([
        "mechanic:roll-20",
        "mechanic:push",
        "mechanic:no-damage",
        "mechanic:unarmed",
      ]),
    ).toBe("Common");
  });

  it("returns null without a push", () => {
    expect(
      inferRarityFromRoll20UtilityTags([
        "mechanic:roll-20",
        "mechanic:no-damage",
        "mechanic:unarmed",
      ]),
    ).toBeNull();
  });

  it("returns null when the rider deals extra damage", () => {
    expect(
      inferRarityFromRoll20UtilityTags([
        "mechanic:roll-20",
        "mechanic:push",
        "mechanic:extra-damage:minor",
        "mechanic:unarmed",
      ]),
    ).toBeNull();
  });
});
