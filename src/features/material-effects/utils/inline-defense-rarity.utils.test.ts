import { describe, expect, it } from "vitest";
import {
  inferInlineDamageDefenseRarity,
  parseInlineDamageDefenses,
} from "./inline-defense-rarity.utils";

describe("parseInlineDamageDefenses", () => {
  it("detects armor fire immunity", () => {
    expect(
      parseInlineDamageDefenses(
        "You are immune to fire damage while you wear this armor.",
      ),
    ).toEqual([{ kind: "immunity", types: ["fire"] }]);
  });

  it("detects armor lightning resistance with a comma", () => {
    expect(
      parseInlineDamageDefenses(
        "You have resistance to lightning damage, while you wear this armor.",
      ),
    ).toEqual([{ kind: "resistance", types: ["lightning"] }]);
  });

  it("detects multiple damage types in one grant", () => {
    expect(
      parseInlineDamageDefenses(
        "You have resistance to fire and cold damage while you wear this armor.",
      ),
    ).toEqual([{ kind: "resistance", types: ["fire", "cold"] }]);
  });

  it("ignores condition-only immunity", () => {
    expect(
      parseInlineDamageDefenses(
        "You are immune to the {@condition poisoned} condition while you wear this armor.",
      ),
    ).toEqual([]);
  });

  it("ignores negated or conditional mentions", () => {
    expect(
      parseInlineDamageDefenses(
        "Unless you are immune to fire damage, you take 2d6 fire damage.",
      ),
    ).toEqual([]);
  });
});

describe("inferInlineDamageDefenseRarity", () => {
  it("catalogues resistance as Rare", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "You have resistance to cold damage while you wear this armor.",
      ),
    ).toBe("Rare");
  });

  it("catalogues immunity as Very Rare", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "You are immune to fire damage while you wear this armor.",
      ),
    ).toBe("Very Rare");
  });

  it("uses immunity rarity when both appear", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "You have resistance to cold damage. You are immune to fire damage while you wear this armor.",
      ),
    ).toBe("Very Rare");
  });

  it("returns null when the text does not grant a damage defense", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "Your weapon deals an extra {@damage 1d6} lightning damage.",
      ),
    ).toBeNull();
  });
});
