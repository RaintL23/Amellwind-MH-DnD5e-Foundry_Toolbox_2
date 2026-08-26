import { describe, expect, it } from "vitest";
import type { DndFeat, SubclassSpellEntry } from "@/shared/types";
import { resolveBonusCantripPools } from "./cantrip-pools.utils";

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
      innate: {
        _: {
          daily: {
            "1": [{ choose: "level=1|class=Cleric" } as SubclassSpellEntry],
          },
        },
      },
      known: {
        _: [{ choose: "level=0|class=Cleric", count: 2 } as SubclassSpellEntry],
      },
    },
    {
      name: "Druid Spells",
      innate: {
        _: {
          daily: {
            "1": [{ choose: "level=1|class=Druid" } as SubclassSpellEntry],
          },
        },
      },
      known: {
        _: [{ choose: "level=0|class=Druid", count: 2 } as SubclassSpellEntry],
      },
    },
    {
      name: "Wizard Spells",
      innate: {
        _: {
          daily: {
            "1": [{ choose: "level=1|class=Wizard" } as SubclassSpellEntry],
          },
        },
      },
      known: {
        _: [{ choose: "level=0|class=Wizard", count: 2 } as SubclassSpellEntry],
      },
    },
  ],
};

describe("resolveBonusCantripPools", () => {
  it("creates cantrip and level-1 pools after Magic Initiate spell list is chosen", () => {
    const pools = resolveBonusCantripPools({
      optionalFeatureSelections: {},
      progressions: [],
      optionalCatalog: [],
      featCatalog: [magicInitiate],
      classData: null,
      subclass: null,
      level: 1,
      backgroundOriginFeat: {
        id: magicInitiate.id,
        name: magicInitiate.name,
        source: "dnd2024",
        spellListClassChoice: "Wizard",
      },
    });

    expect(pools).toHaveLength(2);
    expect(pools[0]).toMatchObject({
      spellLevel: 0,
      maxCount: 2,
      spellListClassName: "Wizard",
      needsSpellListChoice: undefined,
    });
    expect(pools[1]).toMatchObject({
      spellLevel: 1,
      maxCount: 1,
      spellListClassName: "Wizard",
      label: expect.stringContaining("Level 1 spell"),
    });
    expect(pools[1]?.slot).toBe("spell-feat-origin-feat-background-level-1");
  });
});
