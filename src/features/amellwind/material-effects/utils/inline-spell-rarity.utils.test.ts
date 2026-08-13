import { describe, expect, it } from "vitest";
import {
  inferRarityFromSpellMechanicTags,
  rarityForSpellLevel,
} from "./inline-spell-rarity.utils";

describe("rarityForSpellLevel", () => {
  it("maps DMG-aligned bands", () => {
    expect(rarityForSpellLevel(0)).toBe("Uncommon");
    expect(rarityForSpellLevel(1)).toBe("Uncommon");
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

  it("maps cantrip to Uncommon", () => {
    expect(inferRarityFromSpellMechanicTags(["mechanic:cantrip"])).toBe(
      "Uncommon",
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
});
