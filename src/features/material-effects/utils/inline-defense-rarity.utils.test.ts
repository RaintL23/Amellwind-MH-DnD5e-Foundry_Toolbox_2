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
    ).toEqual([{ kind: "immunity", types: ["fire"], limited: false }]);
  });

  it("detects armor lightning resistance with a comma", () => {
    expect(
      parseInlineDamageDefenses(
        "You have resistance to lightning damage, while you wear this armor.",
      ),
    ).toEqual([{ kind: "resistance", types: ["lightning"], limited: false }]);
  });

  it("detects multiple damage types in one grant", () => {
    expect(
      parseInlineDamageDefenses(
        "You have resistance to fire and cold damage while you wear this armor.",
      ),
    ).toEqual([
      { kind: "resistance", types: ["fire", "cold"], limited: false },
    ]);
  });

  it("detects resistant-to wording with condition immunity in one sentence", () => {
    expect(
      parseInlineDamageDefenses(
        "You are resistant to poison damage and immune to the {@condition poisoned} condition while you wear this armor.",
      ),
    ).toEqual([{ kind: "resistance", types: ["poison"], limited: false }]);
  });

  it("detects chained damage immunity after resistance", () => {
    expect(
      parseInlineDamageDefenses(
        "You have resistance to cold damage and are immune to fire damage while you wear this armor.",
      ),
    ).toEqual([
      { kind: "resistance", types: ["cold"], limited: false },
      { kind: "immunity", types: ["fire"], limited: false },
    ]);
  });

  it("detects shorthand poison immunity with disease", () => {
    expect(
      parseInlineDamageDefenses(
        "You are immune to poison and disease while you wear this armor.",
      ),
    ).toEqual([{ kind: "immunity", types: ["poison"], limited: false }]);
  });

  it("detects reaction/bonus-action temporary resistance", () => {
    expect(
      parseInlineDamageDefenses(
        "While you are wearing this armor, you can use your reaction or bonus action to gain resistance to lightning damage until the end of your next turn. You can use this property twice, regaining all uses when you finish a long rest.",
      ),
    ).toEqual([{ kind: "resistance", types: ["lightning"], limited: true }]);
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
  it("catalogues always-on resistance as Rare", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "You have resistance to cold damage while you wear this armor.",
      ),
    ).toBe("Rare");
  });

  it("catalogues limited reaction/bonus-action resistance as Uncommon", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "While you are wearing this armor, you can use your reaction or bonus action to gain resistance to lightning damage until the end of your next turn. You can use this property twice, regaining all uses when you finish a long rest.",
      ),
    ).toBe("Uncommon");
  });

  it("catalogues action-activated 1-minute resistance as Uncommon", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "As an action, you gain resistance to necrotic damage for 1 minute. Once you use this property, you can't use it again until you finish a long rest.",
      ),
    ).toBe("Uncommon");
  });

  it("catalogues always-on immunity as Very Rare", () => {
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

  it("catalogues shorthand poison immunity as Very Rare", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "You are immune to poison and disease while you wear this armor.",
      ),
    ).toBe("Very Rare");
  });

  it("catalogues resistant-to poison + poisoned condition as Rare", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "You are resistant to poison damage and immune to the {@condition poisoned} condition while you wear this armor.",
      ),
    ).toBe("Rare");
  });

  it("returns null when the text does not grant a damage defense", () => {
    expect(
      inferInlineDamageDefenseRarity(
        "Your weapon deals an extra {@damage 1d6} lightning damage.",
      ),
    ).toBeNull();
  });
});
