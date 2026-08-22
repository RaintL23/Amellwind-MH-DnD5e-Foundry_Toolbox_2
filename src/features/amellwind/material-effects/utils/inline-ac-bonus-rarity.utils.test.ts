import { describe, expect, it } from "vitest";
import {
  inferRarityFromAcBonus,
  parseAcBonusAmount,
} from "./inline-ac-bonus-rarity.utils";

describe("parseAcBonusAmount", () => {
  it("parses standing +1 AC", () => {
    expect(
      parseAcBonusAmount(
        "You have a +1 bonus to your AC while you wear this armor.",
      ),
    ).toBe(1);
  });

  it("parses spaced + 2 AC", () => {
    expect(
      parseAcBonusAmount("You gain a + 2 bonus to AC and advantage on saves."),
    ).toBe(2);
  });

  it("parses max N AC from Con modifier grants", () => {
    expect(
      parseAcBonusAmount(
        "you gain a bonus to your AC equal to your Constitution modifier (max 3) in addition to the armor’s normal AC.",
      ),
    ).toBe(3);
  });
});

describe("inferRarityFromAcBonus", () => {
  it("assigns Uncommon for always-on +1 AC", () => {
    expect(
      inferRarityFromAcBonus(
        "You have a +1 bonus to your AC while you wear this armor.",
        ["mechanic:armor-class", "mechanic:passive", "type:defensive"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare for always-on +2 AC", () => {
    expect(
      inferRarityFromAcBonus(
        "You have a +2 bonus to AC while you wear this armor.",
        ["mechanic:armor-class", "mechanic:passive"],
      ),
    ).toBe("Rare");
  });

  it("assigns Common for reaction Shield +1 AC", () => {
    expect(
      inferRarityFromAcBonus(
        "While you are attuned to this armor and you use a reaction that would increase your AC, you gain an additional +1 bonus to your AC until the start of your next turn.",
        ["mechanic:armor-class", "mechanic:reaction", "mechanic:active"],
      ),
    ).toBe("Common");
  });

  it("assigns Uncommon for reaction Shield+ +2 AC", () => {
    expect(
      inferRarityFromAcBonus(
        "you gain an additional +2 bonus to your AC until the start of your next turn.",
        ["mechanic:armor-class", "mechanic:reaction", "mechanic:active"],
      ),
    ).toBe("Uncommon");
  });

  it("returns null without mechanic:armor-class", () => {
    expect(
      inferRarityFromAcBonus("You have a +1 bonus to your AC.", [
        "mechanic:passive",
      ]),
    ).toBeNull();
  });
});
