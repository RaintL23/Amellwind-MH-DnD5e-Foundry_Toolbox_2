import { describe, expect, it } from "vitest";
import type { AbilityScores, Class } from "@/shared/types";
import { mapMulticlassRequirements } from "@/features/dnd/classes/mappers/class-multiclass.mapper";
import { getFeatSlotLevels } from "./builder-class.utils";
import {
  buildClassLevelEntries,
  collectPrerequisiteFailures,
  getFeatSlotLevelsForBuild,
  isMulticlassSpellSlot,
  parseMulticlassSpellSlot,
  resolveMulticlassEntryContexts,
  toMulticlassSpellSlot,
} from "./multiclass.utils";

function stubClass(
  name: string,
  overrides: Partial<Class> = {},
  subclassLevel = 3,
): Class {
  return {
    id: `${name.toLowerCase()}|xphb`,
    name,
    source: "XPHB",
    subclassTitle: `${name} Subclass`,
    subclasses: [],
    progression: [
      { level: subclassLevel, features: [{ gainSubclassFeature: true }] },
    ],
    skillChoiceGrants: [],
    toolGrants: [],
    weaponGrants: [],
    armorGrants: [],
    ...overrides,
  } as unknown as Class;
}

function ref(cls: Class) {
  return { id: cls.id, name: cls.name };
}

function scores(overrides: Partial<AbilityScores>): AbilityScores {
  return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...overrides };
}

describe("mapMulticlassRequirements", () => {
  it("expands PHB `or` requirements into alternatives", () => {
    expect(
      mapMulticlassRequirements({ requirements: { or: [{ str: 13, dex: 13 }] } }),
    ).toEqual([{ str: 13 }, { dex: 13 }]);
  });

  it("keeps AND requirements in one group", () => {
    expect(
      mapMulticlassRequirements({ requirements: { dex: 13, wis: 13 } }),
    ).toEqual([{ dex: 13, wis: 13 }]);
  });

  it("falls back to the XPHB primary ability at 13", () => {
    expect(
      mapMulticlassRequirements({}, [{ str: true, cha: true }]),
    ).toEqual([{ str: 13, cha: 13 }]);
    expect(
      mapMulticlassRequirements(undefined, [{ str: true }, { dex: true }]),
    ).toEqual([{ str: 13 }, { dex: 13 }]);
  });
});

describe("collectPrerequisiteFailures", () => {
  const fighter = stubClass("Fighter", {
    multiclassRequirements: [{ str: 13 }, { dex: 13 }],
  });
  const paladin = stubClass("Paladin", {
    multiclassRequirements: [{ str: 13, cha: 13 }],
  });

  function entries(...classes: Class[]) {
    const [primary, ...rest] = classes;
    return buildClassLevelEntries(
      ref(primary),
      primary,
      1,
      null,
      rest.map((cls) => ({ classRef: ref(cls), level: 1, subclass: null })),
      rest,
    );
  }

  it("accepts any alternative group", () => {
    expect(
      collectPrerequisiteFailures(entries(fighter, paladin), scores({ str: 13, cha: 13 })),
    ).toEqual([]);
    expect(
      collectPrerequisiteFailures(entries(fighter), scores({ dex: 14 })),
    ).toEqual([]);
  });

  it("reports every class that misses its prerequisite, primary included", () => {
    const failures = collectPrerequisiteFailures(
      entries(fighter, paladin),
      scores({ str: 12, dex: 12, cha: 15 }),
    );
    expect(failures.map((f) => f.className)).toEqual(["Fighter", "Paladin"]);
    expect(failures[0].requirement).toBe("Strength 13 or Dexterity 13");
  });
});

describe("feat slots", () => {
  it("gives Rogue its extra ASI at level 10", () => {
    expect(getFeatSlotLevels("Rogue", 10)).toEqual([4, 8, 10]);
  });

  it("grants ASIs at class levels, not character levels", () => {
    const fighter = stubClass("Fighter");
    const wizard = stubClass("Wizard", {}, 2);
    const build = (fighterLevel: number, wizardLevel: number) =>
      getFeatSlotLevelsForBuild(
        buildClassLevelEntries(
          ref(fighter),
          fighter,
          fighterLevel,
          null,
          [{ classRef: ref(wizard), level: wizardLevel, subclass: null }],
          [wizard],
        ),
        fighterLevel + wizardLevel,
      );

    expect(build(3, 1)).toEqual([]);
    // Fighter 4 & 6 at character levels 4 & 6; Wizard 4 at character level 10.
    expect(build(6, 4)).toEqual([4, 6, 10]);
  });
});

describe("additional class spell slots and contexts", () => {
  it("round-trips scoped spell slot ids", () => {
    const slot = toMulticlassSpellSlot(1, "spell-cantrip-pool-a");
    expect(isMulticlassSpellSlot(slot)).toBe(true);
    expect(isMulticlassSpellSlot("spell-level-1")).toBe(false);
    expect(parseMulticlassSpellSlot(slot)).toEqual({
      index: 1,
      innerSlot: "spell-cantrip-pool-a",
    });
  });

  it("skips empty rows and class data still loading for another class", () => {
    const wizard = stubClass("Wizard");
    const cleric = stubClass("Cleric");
    const contexts = resolveMulticlassEntryContexts(
      [
        { classRef: null, level: 1, subclass: null },
        { classRef: ref(wizard), level: 2, subclass: null },
        { classRef: ref(cleric), level: 1, subclass: null },
      ],
      [null, wizard, wizard],
    );
    expect(contexts.map((c) => [c.index, c.classData.name])).toEqual([[1, "Wizard"]]);
  });
});
