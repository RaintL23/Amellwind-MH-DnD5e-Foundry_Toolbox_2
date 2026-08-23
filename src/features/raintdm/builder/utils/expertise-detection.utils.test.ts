import { describe, expect, it } from "vitest";
import type { Class, ClassFeatureEntry } from "@/shared/types";
import { detectExpertiseGrants } from "./expertise-detection.utils";

function makeFeature(
  overrides: Partial<ClassFeatureEntry> & Pick<ClassFeatureEntry, "name" | "level">,
): ClassFeatureEntry {
  return {
    uid: "test",
    displayName: overrides.name,
    source: "XPHB",
    content: [],
    description: [],
    ...overrides,
  };
}

function makeClass(features: ClassFeatureEntry[], level = 2): Class {
  return {
    id: "xphb::ranger",
    name: "Ranger",
    source: "XPHB",
    hitDie: "d10",
    proficiencies: [],
    spellProgression: [],
    progression: [
      {
        level,
        features,
        tableCells: [],
      },
    ],
    subclasses: [],
    startingProficiencies: [],
    startingEquipment: [],
    startingEquipmentOffers: { groups: [] },
    summary: "Ranger",
    saveProficiencies: [],
    skillChoiceGrants: [],
    toolGrants: [],
    armorGrants: [],
    weaponGrants: [],
    languageGrants: [],
    multiclassing: [],
  } as Class;
}

describe("detectExpertiseGrants", () => {
  it("detects Deft Explorer nested expertise at ranger level 2", () => {
    const deftExplorer = makeFeature({
      name: "Deft Explorer",
      level: 2,
      description: [
        "Thanks to your travels, you gain the following benefits. Expertise Choose one of your skill proficiencies with which you lack Expertise. You gain Expertise in that skill. Languages You know two languages of your choice from the language tables in chapter 2.",
      ],
    });

    const grants = detectExpertiseGrants(makeClass([deftExplorer]), 2);

    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      kind: "chooseProficient",
      count: 1,
      source: {
        type: "feature",
        name: "Deft Explorer (Ranger, lvl 2)",
      },
    });
  });

  it("detects standalone Expertise feature at ranger level 9", () => {
    const expertise = makeFeature({
      name: "Expertise",
      level: 9,
      description: [
        "Choose two of your skill proficiencies with which you lack Expertise. You gain Expertise in those skills.",
      ],
    });

    const grants = detectExpertiseGrants(makeClass([expertise], 9), 9);

    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      kind: "chooseProficient",
      count: 2,
    });
  });
});
