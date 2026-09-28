import { describe, expect, it } from "vitest";
import type { Feat } from "@/shared/types";
import {
  applyFeatDamageTypeChoiceToText,
  parseFeatDamageTypeOptions,
} from "./feat-damage-type-choice.utils";

const elementalAdept: Feat = {
  id: "elemental-adept|xphb",
  name: "Elemental Adept",
  source: "XPHB",
  prerequisites: ["Level 4+", "Spellcasting or Pact Magic feature"],
  prerequisiteKinds: ["level", "spellcasting"],
  prerequisiteLevels: [4],
  prerequisiteCheckGroups: [],
  abilityIncreases: [],
  paragraphs: ["You gain the following benefits."],
  sections: [
    {
      name: "Energy Mastery",
      paragraphs: [
        "Choose one of the following damage types: Acid, Cold, Fire, Lightning, or Thunder. Spells you cast ignore Resistance to damage of the chosen type.",
      ],
    },
  ],
  repeatable: true,
  summary: "",
  skillGrants: [],
  expertiseGrants: [],
};

describe("feat-damage-type-choice.utils", () => {
  it("parses Elemental Adept damage type options", () => {
    expect(parseFeatDamageTypeOptions(elementalAdept)).toEqual([
      "acid",
      "cold",
      "fire",
      "lightning",
      "thunder",
    ]);
  });

  it("rewrites the choose sentence with the selected type", () => {
    const text = applyFeatDamageTypeChoiceToText(
      elementalAdept.sections[0]!.paragraphs[0]!,
      "fire",
      parseFeatDamageTypeOptions(elementalAdept),
    );
    expect(text).toContain("Your chosen damage type is Fire.");
    expect(text).not.toMatch(/Acid, Cold, Fire/i);
  });
});
