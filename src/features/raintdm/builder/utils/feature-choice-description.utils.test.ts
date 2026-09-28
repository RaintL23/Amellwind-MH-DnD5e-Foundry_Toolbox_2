import { describe, expect, it } from "vitest";
import type {
  BuilderOptionalFeatureSelections,
  OptionalFeatureProgression,
} from "@/shared/types";
import {
  isUnselectedFeatureChoiceOption,
  resolveFeatureChoiceParentDescription,
  shouldOmitClassFeatureForChoices,
} from "./feature-choice-description.utils";

const divineOrder: OptionalFeatureProgression = {
  id: "fc_class_cleric_divine_order_L1",
  name: "Divine Order",
  featureTypes: [],
  catalog: "feature-choice",
  pickMode: "one",
  choiceOptions: [
    {
      id: "protector",
      name: "Protector",
      source: "XPHB",
      entries: ["You gain Martial weapon proficiency and Medium armor."],
    },
    {
      id: "thaumaturge",
      name: "Thaumaturge",
      source: "XPHB",
      entries: ["You know one extra Cleric cantrip."],
    },
  ],
  scope: "class",
  ownerId: "cleric|xphb",
  progression: { "1": 1 },
};

const fightingStyle: OptionalFeatureProgression = {
  id: "class_Fighter_XPHB_FS",
  name: "Fighting Style",
  featureTypes: ["FS"],
  catalog: "feat",
  featCategories: ["FS"],
  scope: "class",
  ownerId: "fighter|xphb",
  progression: { "1": 1 },
};

describe("feature-choice-description.utils", () => {
  it("hides unselected Divine Order options", () => {
    const selections: BuilderOptionalFeatureSelections = {
      [divineOrder.id]: [
        {
          id: "protector",
          name: "Protector",
          source: "XPHB",
          progressionId: divineOrder.id,
          featureTypes: [],
        },
      ],
    };
    expect(
      isUnselectedFeatureChoiceOption("Thaumaturge", [divineOrder], selections),
    ).toBe(true);
    expect(
      isUnselectedFeatureChoiceOption("Protector", [divineOrder], selections),
    ).toBe(false);
  });

  it("omits Fighting Style parent when a style is picked", () => {
    const selections: BuilderOptionalFeatureSelections = {
      [fightingStyle.id]: [
        {
          id: "archery|xphb",
          name: "Archery",
          source: "XPHB",
          progressionId: fightingStyle.id,
          featureTypes: ["FS"],
        },
      ],
    };
    expect(
      shouldOmitClassFeatureForChoices(
        "Fighting Style",
        [fightingStyle],
        selections,
      ),
    ).toBe(true);
    expect(
      shouldOmitClassFeatureForChoices("Archery", [fightingStyle], selections),
    ).toBe(false);
  });

  it("appends only the chosen option to the parent description", () => {
    const desc = resolveFeatureChoiceParentDescription(
      [
        "You have dedicated yourself to one of the following sacred roles.",
        "Protector: You gain Martial weapon proficiency and Medium armor.",
        "Thaumaturge: You know one extra Cleric cantrip.",
      ],
      divineOrder,
      [
        {
          id: "protector",
          name: "Protector",
          source: "XPHB",
          progressionId: divineOrder.id,
          featureTypes: [],
        },
      ],
    );
    expect(desc).toContain("sacred roles");
    expect(desc).toContain("Protector:");
    expect(desc).not.toContain("Thaumaturge");
  });
});
