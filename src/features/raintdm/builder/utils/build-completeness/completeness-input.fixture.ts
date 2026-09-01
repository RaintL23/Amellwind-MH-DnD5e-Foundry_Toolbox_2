import type { BuildCompletenessInput } from "../build-completeness.types";

/** Blank completeness snapshot — every field at its "not chosen" default. */
export function createEmptyCompletenessInput(
  overrides: Partial<BuildCompletenessInput> = {},
): BuildCompletenessInput {
  return {
    species: null,
    background: null,
    classSelection: null,
    subclass: null,
    level: 1,
    classData: null,
    subclassData: null,
    speciesData: null,
    dndBackground: null,
    useAmellwindHomebrew: false,
    speciesOriginFeatGrant: null,
    backgroundOriginFeatGrant: null,
    speciesOriginFeat: null,
    backgroundOriginFeat: null,
    featSelections: [],
    optionalFeatureOriginFeatSlots: [],
    optionalFeatureOriginFeats: [],
    optionalFeatureSelections: {},
    allSkillGrants: [],
    allExpertiseGrants: [],
    allToolGrants: [],
    allLanguageGrants: [],
    allDefenseGrants: [],
    classSkillChoices: {},
    backgroundSkillChoices: [],
    speciesSkillChoices: [],
    featSkillChoices: {},
    originFeatSkillChoices: [],
    optionalFeatureOriginFeatSkillChoices: {},
    expertiseChoices: {},
    classToolChoices: {},
    backgroundToolChoices: [],
    speciesToolChoices: [],
    classLanguageChoices: {},
    backgroundLanguageChoices: [],
    speciesLanguageChoices: [],
    speciesDefenseChoices: {},
    speciesAbilityChoices: [],
    backgroundAsiMode: null,
    backgroundAsiPlus2: null,
    backgroundAsiPlus1: null,
    useTashaOrigin: false,
    tashaPlus2: null,
    tashaPlus1: null,
    mainHand: null,
    offHand: null,
    armor: null,
    equippedShield: null,
    inventoryItems: [],
    spellcasting: null,
    ...overrides,
  };
}

export function hasIssueId(
  issues: ReadonlyArray<{ id: string }>,
  id: string,
): boolean {
  return issues.some((issue) => issue.id === id);
}
