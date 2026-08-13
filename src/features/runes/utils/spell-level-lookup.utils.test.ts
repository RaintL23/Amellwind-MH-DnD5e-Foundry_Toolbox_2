import { describe, expect, it } from "vitest";
import {
  buildSpellLevelLookup,
  extractSpellNamesFromEffectText,
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

  it("maps levels to precise tags", () => {
    expect(spellTagsFromLevels([4])).toEqual(["mechanic:spell:lvl4"]);
    expect(spellTagsFromLevels([0])).toEqual(["mechanic:cantrip"]);
    expect(spellTagsFromLevels([0, 1])).toEqual([
      "mechanic:cantrip",
      "mechanic:spell:lvl1",
    ]);
  });
});
