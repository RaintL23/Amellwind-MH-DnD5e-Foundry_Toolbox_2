import { describe, expect, it } from "vitest";
import {
  inferRarityFromSpellBuff,
  parseSpellBuffBonusAmount,
} from "./inline-spell-buff-rarity.utils";

describe("parseSpellBuffBonusAmount", () => {
  it("parses standing +2 and ignores increases-to bump", () => {
    expect(
      parseSpellBuffBonusAmount(
        "You gain a +2 bonus to your spell attack rolls and spell save DC while attuned to this weapon. This bonus increases to +4 when the spell you are casting deals fire damage.",
      ),
    ).toBe(2);
  });

  it("parses spaced + 2 bonus", () => {
    expect(
      parseSpellBuffBonusAmount(
        "You gain a + 2 bonus to your spell attack rolls and spell save DC while attuned to this weapon.",
      ),
    ).toBe(2);
  });

  it("parses gain +3 to spell attack rolls", () => {
    expect(
      parseSpellBuffBonusAmount(
        "You gain +3 to spell attack rolls and you ignore half cover when making a spell attack.",
      ),
    ).toBe(3);
  });

  it("parses increase the spell save DC by 1", () => {
    expect(
      parseSpellBuffBonusAmount(
        "When you cast a spell that deals fire damage, you increase the spell save DC by 1.",
      ),
    ).toBe(1);
  });

  it("parses each increase by 2", () => {
    expect(
      parseSpellBuffBonusAmount(
        "Your spell save DC and spell attack bonus each increase by 2.",
      ),
    ).toBe(2);
  });
  it("parses Coalescence attack rolls and spell save DC", () => {
    expect(
      parseSpellBuffBonusAmount(
        "you gain a +2 bonus to your attack rolls and spell save DC, and your weapon deals extra damage",
      ),
    ).toBe(2);
  });
});

describe("inferRarityFromSpellBuff", () => {
  it("assigns Uncommon for always-on +1 spell attack", () => {
    expect(
      inferRarityFromSpellBuff(
        "While attuned to this weapon, you gain a +1 bonus to your spell attack rolls when casting fire spells.",
        ["mechanic:spell-buff:damage", "mechanic:passive"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare for always-on +2 spell attack and DC", () => {
    expect(
      inferRarityFromSpellBuff(
        "You gain a +2 bonus to your spell attack rolls and spell save DC while attuned to this weapon.",
        [
          "mechanic:spell-buff:damage",
          "mechanic:spell-buff:save",
          "mechanic:passive",
        ],
      ),
    ).toBe("Rare");
  });

  it("assigns Very Rare for always-on +3", () => {
    expect(
      inferRarityFromSpellBuff(
        "You gain a +3 bonus to your spell attack rolls and spell save DC while attuned to this weapon.",
        [
          "mechanic:spell-buff:damage",
          "mechanic:spell-buff:save",
          "mechanic:passive",
        ],
      ),
    ).toBe("Very Rare");
  });

  it("returns null without spell-buff tags", () => {
    expect(
      inferRarityFromSpellBuff(
        "You gain a +2 bonus to your spell attack rolls.",
        ["mechanic:passive"],
      ),
    ).toBeNull();
  });
});
