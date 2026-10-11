import { describe, expect, it } from "vitest";
import {
  describeCascadeLoss,
  type CascadeLossState,
} from "./cascade-loss.utils";

function emptyState(overrides: Partial<CascadeLossState> = {}): CascadeLossState {
  return {
    subclass: null,
    featSelections: [],
    spellSelections: {},
    optionalFeatureSelections: {},
    classSkillChoices: {},
    expertiseChoices: {},
    classToolChoices: {},
    classWeaponChoices: {},
    classLanguageChoices: {},
    speciesAbilityChoices: [],
    speciesOriginFeat: null,
    speciesTraitChoices: {},
    speciesSkillChoices: [],
    speciesToolChoices: [],
    speciesWeaponChoices: [],
    speciesLanguageChoices: [],
    speciesDefenseChoices: {},
    backgroundAsiMode: null,
    backgroundOriginFeat: null,
    backgroundSkillChoices: [],
    backgroundToolChoices: [],
    backgroundLanguageChoices: [],
    ...overrides,
  };
}

describe("describeCascadeLoss", () => {
  it("returns nothing when no dependent choices were made", () => {
    expect(describeCascadeLoss(emptyState(), "class")).toEqual([]);
    expect(describeCascadeLoss(emptyState(), "species")).toEqual([]);
    expect(describeCascadeLoss(emptyState(), "background")).toEqual([]);
  });

  it("lists subclass, feats and class picks for a class change", () => {
    const lost = describeCascadeLoss(
      emptyState({
        subclass: { id: "battle-master", name: "Battle Master" },
        featSelections: [
          { id: "alert|xphb", name: "Alert", source: "dnd2024" },
          null,
        ],
        classSkillChoices: { 0: ["ath", "prc"] },
        classToolChoices: { 0: ["Smith's Tools"] },
      }),
      "class",
    );
    expect(lost).toEqual([
      "Subclass: Battle Master",
      "1 feat",
      "3 class proficiency picks",
    ]);
  });

  it("ignores class picks when the species changes", () => {
    const lost = describeCascadeLoss(
      emptyState({
        classSkillChoices: { 0: ["ath"] },
        speciesAbilityChoices: ["str", null],
        speciesOriginFeat: { id: "lucky|xphb", name: "Lucky", source: "dnd2024" },
      }),
      "species",
    );
    expect(lost).toEqual(["Species ability bonuses", "Origin feat: Lucky"]);
  });

  it("keeps the origin feat when the same species is picked again", () => {
    const lost = describeCascadeLoss(
      emptyState({
        speciesOriginFeat: { id: "lucky|xphb", name: "Lucky", source: "dnd2024" },
      }),
      "species",
      { sameSpecies: true },
    );
    expect(lost).toEqual([]);
  });
});
