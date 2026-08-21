import { describe, expect, it } from "vitest";
import {
  buildSpellLevelLookup,
  extractSpellNamesFromEffectText,
  findCatalogSpellLevelsInPlainText,
  parseCastAtSpellLevel,
  resolveSpellLevelsFromText,
  spellTagsFromLevels,
} from "./spell-level-lookup.utils";

function makeSpell(name: string, level: number) {
  return { name, level };
}

describe("spell-level-lookup", () => {
  const lookup = buildSpellLevelLookup([
    makeSpell("Light", 0),
    makeSpell("Shield", 1),
    makeSpell("Earth Tremor", 1),
    makeSpell("Dust Devil", 2),
    makeSpell("Dimension Door", 4),
    makeSpell("Fireball", 3),
  ]);

  it("extracts spell names from 5etools tags", () => {
    expect(
      extractSpellNamesFromEffectText(
        "cast the {@spell dimension door|XPHB} spell",
      ),
    ).toEqual(["dimension door"]);
  });

  it("resolves dimension door as level 4", () => {
    expect(
      resolveSpellLevelsFromText(
        "you can cast the {@spell dimension door} spell as an action",
        lookup,
      ),
    ).toEqual([4]);
  });

  it("resolves plain MHMM cast wording from the catalog", () => {
    expect(
      findCatalogSpellLevelsInPlainText(
        "(Bard, Druid, Sorcerer, & Wizard Only) While attuned to this weapon you can cast the Earth Tremor spell once per long rest, without expending a spell slot.",
        lookup,
      ),
    ).toEqual([1]);
  });

  it("resolves multiple plain spell names and raises to cast-at level", () => {
    expect(
      resolveSpellLevelsFromText(
        "you can cast the Earth Tremor and the Dust Devil spell at 2nd level once per day",
        lookup,
      ),
    ).toEqual([2, 2]);
  });

  it("parses cast-at spell level", () => {
    expect(parseCastAtSpellLevel("cast catapult at 2nd level")).toBe(2);
    expect(
      parseCastAtSpellLevel("you cast the 3rd-level version of the spell"),
    ).toBe(3);
  });

  it("maps levels to precise tags", () => {
    expect(spellTagsFromLevels([4])).toEqual(["mechanic:spell:lvl4"]);
    expect(spellTagsFromLevels([0])).toEqual(["mechanic:cantrip"]);
    expect(spellTagsFromLevels([0, 1])).toEqual([
      "mechanic:cantrip",
      "mechanic:spell:lvl1",
    ]);
  });
});
