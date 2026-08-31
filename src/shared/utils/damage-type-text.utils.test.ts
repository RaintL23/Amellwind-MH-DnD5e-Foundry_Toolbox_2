import { describe, expect, it } from "vitest";
import {
  CANONICAL_DAMAGE_TYPES,
  ELEMENTAL_DAMAGE_TYPES,
  extractAllDamageTypesFromText,
  extractDamageTypesFromFragment,
  mentionsDamageTypeInText,
  normalizeDamageTypeWord,
} from "./damage-type-text.utils";

describe("damage-type-text.utils", () => {
  it("maps MHMM lighting typo to lightning", () => {
    expect(normalizeDamageTypeWord("lighting")).toBe("lightning");
  });

  it("detects lighting damage mentions as lightning", () => {
    expect(
      mentionsDamageTypeInText(
        "You are immune to lighting damage while you wear this armor.",
        "lightning",
      ),
    ).toBe(true);
  });

  it("extracts lightning from lighting damage fragments", () => {
    expect(extractDamageTypesFromFragment("lighting damage")).toEqual([
      "lightning",
    ]);
  });

  it("extracts multiple elemental types from list fragments", () => {
    expect(
      extractDamageTypesFromFragment("cold, thunder, and lightning damage"),
    ).toEqual(["cold", "thunder", "lightning"]);
  });

  it("extracts every elemental type from dual immunity wording", () => {
    expect(
      extractAllDamageTypesFromText(
        "You are immune to cold and fire damage while you wear this armor.",
      ),
    ).toEqual(expect.arrayContaining(["cold", "fire"]));
  });

  it("extracts physical types from shared-suffix immunity lists", () => {
    expect(
      extractAllDamageTypesFromText(
        "You are immune to bludgeoning, piercing, and slashing damage from CR 2 or lower creatures while you wear this armor.",
      ),
    ).toEqual(["bludgeoning", "piercing", "slashing"]);
  });

  it("extracts all types from mixed immunity and resistance clauses", () => {
    expect(
      extractAllDamageTypesFromText(
        "You are immune to acid damage and resistance to cold, thunder, and lightning damage while you wear this armor.",
      ),
    ).toEqual(["acid", "cold", "lightning", "thunder"]);
  });

  it("extracts types from MHMM resistances typo wording", () => {
    expect(
      extractAllDamageTypesFromText(
        "While wearing this armor you are immune to cold damage and have resistances necrotic damage.",
      ),
    ).toEqual(expect.arrayContaining(["cold", "necrotic"]));
  });

  it("extracts damage types from flat reduction wording", () => {
    expect(
      extractAllDamageTypesFromText(
        "You reduce thunder damage you take by 2 while you wear this armor.",
      ),
    ).toEqual(["thunder"]);
  });

  it("covers every canonical damage type via direct phrase", () => {
    for (const type of CANONICAL_DAMAGE_TYPES) {
      expect(
        extractAllDamageTypesFromText(`You have resistance to ${type} damage.`),
      ).toContain(type);
    }
  });

  it("extracts elemental types from deals-list weapon wording", () => {
    expect(
      extractAllDamageTypesFromText(
        "If your weapon deals cold, fire, lightning, or necrotic damage and you hit a creature with this weapon; roll one additional damage die for the elemental damage.",
      ),
    ).toEqual(["cold", "fire", "lightning", "necrotic"]);
  });

  it("covers every elemental type via immunity shorthand", () => {
    for (const type of ELEMENTAL_DAMAGE_TYPES) {
      expect(
        extractAllDamageTypesFromText(`You are immune to ${type} while you wear this armor.`),
      ).toContain(type);
    }
  });
});
