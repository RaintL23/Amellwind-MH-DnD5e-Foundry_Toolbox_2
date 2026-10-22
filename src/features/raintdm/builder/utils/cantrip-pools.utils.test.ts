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

  it("creates pools for an invocation-granted Magic Initiate (Lessons of the First Ones)", () => {
    const pools = resolveBonusCantripPools({
      optionalFeatureSelections: {},
      progressions: [],
      optionalCatalog: [],
      featCatalog: [magicInitiate],
      classData: null,
      subclass: null,
      level: 2,
      optionalFeatureOriginFeats: [
        {
          id: magicInitiate.id,
          name: magicInitiate.name,
          source: "dnd2024",
          spellListClassChoice: "Druid",
        },
      ],
      optionalFeatureOriginFeatSlots: [
        {
          slotIndex: 0,
          grant: {
            kind: "choose",
            categories: ["O"],
            count: 1,
            summary: "Origin Feat",
          },
          sourceFeatureId: "lessons",
          sourceFeatureName: "Lessons of the First Ones",
          duplicateIndex: 0,
        },
      ],
    });

    expect(pools).toHaveLength(2);
    expect(pools[0]).toMatchObject({
      spellLevel: 0,
      maxCount: 2,
      spellListClassName: "Druid",
      label: "Lessons of the First Ones: Magic Initiate",
    });
    expect(pools[0]?.slot).toBe("spell-cantrip-origin-feat-invocation-0");
    expect(pools[1]?.slot).toBe("spell-feat-origin-feat-invocation-0-level-1");
  });
});
