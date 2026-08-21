import { describe, expect, it } from "vitest";
import { inferRarityFromSpellcastingFocusTags } from "./inline-spellcasting-focus-rarity.utils";

describe("inferRarityFromSpellcastingFocusTags", () => {
  it("assigns Common for spellcasting-focus", () => {
    expect(
      inferRarityFromSpellcastingFocusTags([
        "mechanic:spellcasting-focus",
        "mechanic:passive",
      ]),
    ).toBe("Common");
  });

  it("returns null without spellcasting-focus", () => {
    expect(
      inferRarityFromSpellcastingFocusTags([
        "mechanic:cantrip",
        "mechanic:passive",
      ]),
    ).toBeNull();
  });
});
