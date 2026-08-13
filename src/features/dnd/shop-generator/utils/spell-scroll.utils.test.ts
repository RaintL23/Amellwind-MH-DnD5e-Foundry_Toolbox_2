import { describe, expect, it } from "vitest";
import {
  collectUsedSpellKeysFromStock,
  formatSpellScrollName,
  parseSpellScrollLevel,
  spellScrollPricingAliasKeys,
} from "./spell-scroll.utils";

describe("parseSpellScrollLevel", () => {
  it("parses catalog and CSV-style template names", () => {
    expect(parseSpellScrollLevel("Spell Scroll (Cantrip)")).toBe(0);
    expect(parseSpellScrollLevel("Spell Scroll (1st Level)")).toBe(1);
    expect(parseSpellScrollLevel("Spell Scroll (Level 3)")).toBe(3);
    expect(parseSpellScrollLevel("Spell Scroll, 5th")).toBe(5);
    expect(parseSpellScrollLevel("Spell Scroll (9th Level)")).toBe(9);
  });

  it("ignores specialized or unrelated names", () => {
    expect(parseSpellScrollLevel("Spell Scroll (Fireball)")).toBeNull();
    expect(parseSpellScrollLevel("Scroll of Protection")).toBeNull();
    expect(parseSpellScrollLevel("Wand of Fireballs")).toBeNull();
  });
});

describe("spell scroll helpers", () => {
  it("formats display names and pricing aliases", () => {
    expect(formatSpellScrollName("Fireball")).toBe("Spell Scroll (Fireball)");
    expect(spellScrollPricingAliasKeys("Spell Scroll (3rd Level)")).toEqual([
      "spell scroll 3rd",
    ]);
    expect(spellScrollPricingAliasKeys("Spell Scroll (Cantrip)")).toEqual([
      "spell scroll cantrip",
    ]);
  });

  it("collects used spell keys from specialized stock names", () => {
    const used = collectUsedSpellKeysFromStock([
      "Spell Scroll (Fireball)",
      "Spell Scroll (3rd Level)",
      "Potion of Healing",
      "Spell Scroll (Counterspell)",
    ]);
    expect([...used].sort()).toEqual(["counterspell", "fireball"]);
  });
});
