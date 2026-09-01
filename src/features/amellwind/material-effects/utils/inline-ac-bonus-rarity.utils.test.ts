import { describe, expect, it } from "vitest";
import {
  grantsAcBonusToWearer,
  inferRarityFromAcBonus,
  parseAcBonusAmount,
  usesAcAsSaveReplacement,
} from "./inline-ac-bonus-rarity.utils";
import type { Rune } from "@/shared/types";

function makeRune(partial: Partial<Rune> & Pick<Rune, "name">): Rune {
  return {
    monsterName: "Test Monster",
    monsterSource: "GTMH",
    monsterCr: "5",
    monsterCrs: ["5"],
    tier: 2,
    carveChance: "1-10",
    captureChance: "-",
    rolls: 3,
    slots: ["A", "W"],
    armorEffect: null,
    weaponEffect: null,
    otherEffect: null,
    tags: [],
    weaponTags: [],
    armorTags: [],
    ...partial,
  };
}

describe("usesAcAsSaveReplacement", () => {
  it("detects Guard Up failed-save AC substitution", () => {
    expect(
      usesAcAsSaveReplacement(
        "Guard Up When you fail a Dexterity or Strength saving throw, you can use your reaction to use your AC in place of your roll.",
      ),
    ).toBe(true);
  });

  it("detects dodge-action AC substitution", () => {
    expect(
      usesAcAsSaveReplacement(
        "While taking the dodge action, you can use your Armor Class in place of making the roll.",
      ),
    ).toBe(true);
  });

  it("does not flag standing AC bonuses", () => {
    expect(
      usesAcAsSaveReplacement(
        "You have a +2 bonus to your armor class while you wear this armor.",
      ),
    ).toBe(false);
  });
});

describe("grantsAcBonusToWearer", () => {
  it("excludes Guard Up from AC bonus rule", () => {
    expect(
      grantsAcBonusToWearer(
        makeRune({
          name: "Heavy Rustrazor Scalp",
          armorEffect:
            "Guard Up When you fail a Dexterity or Strength saving throw, you can use your reaction to use your AC in place of your roll.",
          armorTags: ["mechanic:guard-up", "mechanic:reaction"],
        }),
      ),
    ).toBe(false);
  });

  it("includes real AC bonus materials", () => {
    expect(
      grantsAcBonusToWearer(
        makeRune({
          name: "Iron Wall",
          armorEffect:
            "You have a +2 bonus to your armor class while you wear this armor.",
          armorTags: ["mechanic:armor-class", "mechanic:passive"],
        }),
      ),
    ).toBe(true);
  });
});

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
