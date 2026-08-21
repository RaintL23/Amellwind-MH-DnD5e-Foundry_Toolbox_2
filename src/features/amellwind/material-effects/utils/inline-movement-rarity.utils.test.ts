import { describe, expect, it } from "vitest";
import { inferRarityFromMovementTags } from "./inline-movement-rarity.utils";

describe("inferRarityFromMovementTags", () => {
  it("assigns Uncommon for burrowing speed", () => {
    expect(
      inferRarityFromMovementTags([
        "mechanic:movement",
        "mechanic:burrowing",
        "mechanic:passive",
      ]),
    ).toBe("Uncommon");
  });

  it("assigns Common for +5 walking speed", () => {
    expect(
      inferRarityFromMovementTags([
        "mechanic:movement",
        "mechanic:walking-speed",
        "mechanic:passive",
      ]),
    ).toBe("Common");
  });

  it("assigns Uncommon for +10 walking speed (major)", () => {
    expect(
      inferRarityFromMovementTags([
        "mechanic:movement",
        "mechanic:walking-speed",
        "mechanic:movement:major",
      ]),
    ).toBe("Uncommon");
  });

  it("assigns Rare for flying speed under 60", () => {
    expect(
      inferRarityFromMovementTags([
        "mechanic:movement",
        "mechanic:flying",
      ]),
    ).toBe("Rare");
  });

  it("assigns Very Rare for flying 60+ (major)", () => {
    expect(
      inferRarityFromMovementTags([
        "mechanic:movement",
        "mechanic:flying",
        "mechanic:movement:major",
      ]),
    ).toBe("Very Rare");
  });

  it("assigns Uncommon for icy-surfaces Winterlands package", () => {
    expect(
      inferRarityFromMovementTags([
        "mechanic:movement",
        "mechanic:icy-surfaces",
        "mechanic:movement-climb",
        "mechanic:ignore-difficult-terrain",
        "mechanic:passive",
      ]),
    ).toBe("Uncommon");
  });

  it("assigns Common for ignore-difficult-terrain without icy package", () => {
    expect(
      inferRarityFromMovementTags([
        "mechanic:movement",
        "mechanic:ignore-difficult-terrain",
        "mechanic:difficult-terrain",
      ]),
    ).toBe("Common");
  });

  it("returns null for movement debuffs without a mode grant", () => {
    expect(
      inferRarityFromMovementTags(["mechanic:movement"]),
    ).toBeNull();
  });
});
