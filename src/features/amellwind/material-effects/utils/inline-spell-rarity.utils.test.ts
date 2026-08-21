import { describe, expect, it } from "vitest";
import {
  inferRarityFromSpellMechanicTags,
  rarityForSpellLevel,
} from "./inline-spell-rarity.utils";

describe("rarityForSpellLevel", () => {
  it("maps Common-floor bands by spell level", () => {
    expect(rarityForSpellLevel(0)).toBe("Common");
    expect(rarityForSpellLevel(1)).toBe("Common");
    expect(rarityForSpellLevel(2)).toBe("Uncommon");
    expect(rarityForSpellLevel(3)).toBe("Uncommon");
    expect(rarityForSpellLevel(4)).toBe("Rare");
    expect(rarityForSpellLevel(5)).toBe("Rare");
    expect(rarityForSpellLevel(6)).toBe("Very Rare");
    expect(rarityForSpellLevel(8)).toBe("Very Rare");
    expect(rarityForSpellLevel(9)).toBe("Legendary");
  });
});

describe("inferRarityFromSpellMechanicTags", () => {
  it("returns null without spell tags", () => {
    expect(
      inferRarityFromSpellMechanicTags(["mechanic:resistance", "damage:fire"]),
    ).toBeNull();
  });

  it("maps cantrip to Common", () => {
    expect(inferRarityFromSpellMechanicTags(["mechanic:cantrip"])).toBe(
      "Common",
    );
  });

  it("maps 1st-level spell to Common", () => {
    expect(inferRarityFromSpellMechanicTags(["mechanic:spell:lvl1"])).toBe(
      "Common",
    );
  });

  it("maps dimension door lvl4 to Rare", () => {
    expect(
      inferRarityFromSpellMechanicTags(["mechanic:spell:lvl4", "type:defensive"]),
    ).toBe("Rare");
  });

  it("uses the highest spell level among tags", () => {
    expect(
      inferRarityFromSpellMechanicTags([
        "mechanic:cantrip",
        "mechanic:spell:lvl4",
      ]),
    ).toBe("Rare");
  });

  it("maps 4th-level spell-slot recovery to Rare", () => {
    expect(
      inferRarityFromSpellMechanicTags(["mechanic:spell-slot:lvl4"]),
    ).toBe("Rare");
  });

  it("maps 3rd-level spell-slot recovery to Uncommon", () => {
    expect(
      inferRarityFromSpellMechanicTags(["mechanic:spell-slot:lvl3"]),
    ).toBe("Uncommon");
  });

  it("maps unleveled spell-slot recovery to Uncommon", () => {
    expect(inferRarityFromSpellMechanicTags(["mechanic:spell-slot"])).toBe(
      "Uncommon",
    );
  });
});
