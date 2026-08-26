import { describe, expect, it } from "vitest";
import type { DndFeat, SubclassSpellEntry } from "@/shared/types";
import {
  featRequiresSpellListChoice,
  getFeatSpellListOptions,
  resolveFeatSpellBlock,
  resolveFeatSpellListClass,
} from "./feat-spell-list.utils";

const magicInitiate: DndFeat = {
  id: "Magic Initiate::XPHB",
  name: "Magic Initiate",
  source: "XPHB",
  prerequisites: [],
  prerequisiteKinds: [],
  prerequisiteLevels: [],
  prerequisiteCheckGroups: [],
  abilityIncreases: [],
  paragraphs: [],
  sections: [],
  repeatable: true,
  summary: "",
  skillGrants: [],
  expertiseGrants: [],
  isOriginFeat: true,
  additionalSpells: [
    {
      name: "Cleric Spells",
      known: {
        _: [
          { choose: "level=0|class=Cleric", count: 2 } as SubclassSpellEntry,
        ],
      },
    },
    {
      name: "Druid Spells",
      known: {
        _: [
          { choose: "level=0|class=Druid", count: 2 } as SubclassSpellEntry,
        ],
      },
    },
    {
      name: "Wizard Spells",
      known: {
        _: [
          { choose: "level=0|class=Wizard", count: 2 } as SubclassSpellEntry,
        ],
      },
    },
  ],
};

describe("feat-spell-list.utils", () => {
  it("detects choosable spell lists on Magic Initiate", () => {
    expect(getFeatSpellListOptions(magicInitiate)).toEqual([
      "Cleric",
      "Druid",
      "Wizard",
    ]);
    expect(featRequiresSpellListChoice(magicInitiate)).toBe(true);
  });

  it("does not default to Cleric when no list is chosen", () => {
    expect(
      resolveFeatSpellBlock(magicInitiate, {
        spellListClassChoice: null,
      }),
    ).toBeNull();
    expect(
      resolveFeatSpellListClass(magicInitiate, {
        name: "Magic Initiate",
        spellListClassChoice: null,
      }),
    ).toBeNull();
  });

  it("resolves the chosen spell list block", () => {
    expect(
      resolveFeatSpellBlock(magicInitiate, {
        spellListClassChoice: "Druid",
      })?.name,
    ).toBe("Druid Spells");
    expect(
      resolveFeatSpellListClass(magicInitiate, {
        name: "Magic Initiate",
        spellListClassChoice: "Wizard",
      }),
    ).toBe("Wizard");
  });
});
