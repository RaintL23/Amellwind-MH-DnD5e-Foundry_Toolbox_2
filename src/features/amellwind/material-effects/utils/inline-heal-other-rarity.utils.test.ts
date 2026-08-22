import { describe, expect, it } from "vitest";
import { inferRarityFromHealOtherTags } from "./inline-heal-other-rarity.utils";

describe("inferRarityFromHealOtherTags", () => {
  it("assigns Uncommon for heal-other:minor", () => {
    expect(
      inferRarityFromHealOtherTags(["mechanic:heal-other:minor"]),
    ).toBe("Uncommon");
  });

  it("assigns Rare for heal-other:major", () => {
    expect(
      inferRarityFromHealOtherTags(["mechanic:heal-other:major"]),
    ).toBe("Rare");
  });

  it("returns null without heal-other tags", () => {
    expect(inferRarityFromHealOtherTags(["mechanic:healing:minor"])).toBeNull();
  });
});
