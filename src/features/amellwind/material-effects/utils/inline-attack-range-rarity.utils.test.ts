import { describe, expect, it } from "vitest";
import { inferRarityFromAttackRangeTags } from "./inline-attack-range-rarity.utils";

describe("inferRarityFromAttackRangeTags", () => {
  it("assigns Common for +N ft attack-range", () => {
    expect(
      inferRarityFromAttackRangeTags([
        "mechanic:attack-range",
        "weapon-type:ranged",
        "mechanic:passive",
      ]),
    ).toBe("Common");
  });

  it("assigns Uncommon for doubled attack-range", () => {
    expect(
      inferRarityFromAttackRangeTags([
        "mechanic:attack-range",
        "mechanic:attack-range:major",
        "weapon-type:ranged",
      ]),
    ).toBe("Uncommon");
  });

  it("returns null without attack-range", () => {
    expect(
      inferRarityFromAttackRangeTags(["mechanic:reach"]),
    ).toBeNull();
  });
});
