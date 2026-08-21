import { describe, expect, it } from "vitest";
import { inferRarityFromMithralArmorTags } from "./inline-mithral-rarity.utils";

describe("inferRarityFromMithralArmorTags", () => {
  it("assigns Uncommon for mithral", () => {
    expect(
      inferRarityFromMithralArmorTags([
        "mechanic:mithral",
        "mechanic:skill-stealth",
        "mechanic:passive",
      ]),
    ).toBe("Uncommon");
  });

  it("returns null without mithral", () => {
    expect(
      inferRarityFromMithralArmorTags([
        "mechanic:skill-stealth",
        "mechanic:passive",
      ]),
    ).toBeNull();
  });
});
