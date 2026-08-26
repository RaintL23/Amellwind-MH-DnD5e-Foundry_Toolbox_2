import { describe, expect, it } from "vitest";
import type { AbilityScores, BuilderFeatSelection, Species } from "@/shared/types";
import {
  abilityModifiersFromScores,
  computeEffectiveAbilityScores,
} from "./effective-ability-scores";

const BASE: AbilityScores = {
  str: 11,
  dex: 16,
  con: 11,
  int: 11,
  wis: 11,
  cha: 11,
};

const SPECIES_STUB: Species = {
  id: "human",
  name: "Human",
  source: "XPHB",
  category: "folk",
  isSubrace: false,
  sizes: ["Medium"],
  speed: "30 ft.",
  abilityBonuses: [],
  abilitySummary: "",
  resistances: [],
  resistanceSummary: "",
  traitTags: [],
  traits: [],
  fluff: "",
  skillGrants: [],
  skillAdvantages: [],
  languageGrants: [],
  defenseGrants: [],
};

function asiPlus2(ability: "dex"): BuilderFeatSelection {
  return {
    id: "asi",
    name: "Ability Score Improvement",
    source: "asi",
    asiChoices: {
      mode: "plus2",
      plus2: ability,
      plus1a: null,
      plus1b: null,
    },
  };
}

describe("computeEffectiveAbilityScores", () => {
  it("applies Tasha origin +2 and ASI +2 to the final score", () => {
    const scores = computeEffectiveAbilityScores({
      baseScores: BASE,
      level: 10,
      classSelection: { id: "rogue", name: "Rogue" },
      classData: null,
      multiclassEnabled: false,
      multiclassEntries: [],
      multiclassClassData: [],
      species: SPECIES_STUB,
      featSelections: [asiPlus2("dex")],
      useTashaOrigin: true,
      tashaPlus2: "dex",
      tashaPlus1: null,
      speciesAbilityChoices: [],
      background: null,
      backgroundAsiMode: null,
      backgroundAsiPlus2: null,
      backgroundAsiPlus1: null,
    });

    expect(scores.dex).toBe(20);
    expect(abilityModifiersFromScores(scores).dex).toBe(5);
  });

  it("leaves base scores unchanged when no bonuses apply", () => {
    const scores = computeEffectiveAbilityScores({
      baseScores: BASE,
      level: 1,
      classSelection: null,
      classData: null,
      multiclassEnabled: false,
      multiclassEntries: [],
      multiclassClassData: [],
      species: null,
      featSelections: [],
      useTashaOrigin: false,
      tashaPlus2: null,
      tashaPlus1: null,
      speciesAbilityChoices: [],
      background: null,
      backgroundAsiMode: null,
      backgroundAsiPlus2: null,
      backgroundAsiPlus1: null,
    });

    expect(scores).toEqual(BASE);
  });
});
