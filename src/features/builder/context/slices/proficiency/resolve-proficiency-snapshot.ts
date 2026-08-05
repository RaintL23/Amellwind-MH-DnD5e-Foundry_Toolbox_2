import type { AbilityKey, SkillKey } from "@/shared/types";
import type {
  SkillProficiencyGrant,
  ExpertiseGrant,
  SkillAdvantageGrant,
  ProficiencySource,
} from "@/shared/types/proficiency.types";
import {
  resolveFixedGrants,
  resolveFixedExpertiseGrants,
  computeCharacterProficiencies,
  type CharacterProficiencyResult,
} from "@/features/builder/utils/compute-character-proficiencies";
import {
  ORIGIN_FEAT_SOURCE_NAME,
  formatInvocationOriginFeatSourceName,
} from "@/features/builder/utils/origin-feat.constants";
import type { OptionalFeatureOriginFeatSlot } from "@/features/builder/utils/optional-feature-feat-grants.utils";

export interface ProficiencySnapshotInput {
  allSkillGrants: SkillProficiencyGrant[];
  allExpertiseGrants: ExpertiseGrant[];
  allSkillAdvantages: SkillAdvantageGrant[];
  saveProficiencyAbilities: AbilityKey[];
  classSkillChoices: Record<number, SkillKey[]>;
  backgroundSkillChoices: SkillKey[];
  speciesSkillChoices: SkillKey[];
  originFeatSkillChoices: SkillKey[];
  featSkillChoices: Record<number, SkillKey[]>;
  expertiseChoices: Record<string, SkillKey[]>;
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  optionalFeatureOriginFeatSkillChoices: Record<number, SkillKey[]>;
}

export function resolveProficiencySnapshot(
  input: ProficiencySnapshotInput,
): CharacterProficiencyResult {
  const {
    allSkillGrants,
    allExpertiseGrants,
    allSkillAdvantages,
    saveProficiencyAbilities,
    classSkillChoices,
    backgroundSkillChoices,
    speciesSkillChoices,
    originFeatSkillChoices,
    featSkillChoices,
    expertiseChoices,
    optionalFeatureOriginFeatSlots,
    optionalFeatureOriginFeatSkillChoices,
  } = input;

  const fixedSkills = resolveFixedGrants(allSkillGrants);

  const classChooseGrants = allSkillGrants.filter(
    (g) => g.kind !== "fixed" && g.source.type === "class",
  );
  const chosenSkillsFromClass: Array<{ skill: SkillKey; source: ProficiencySource }> =
    Object.entries(classSkillChoices).flatMap(([idx, skills]) =>
      skills.map((sk) => ({
        skill: sk,
        source:
          classChooseGrants[Number(idx)]?.source ?? {
            type: "class" as const,
            name: "Class",
          },
      })),
    );
  const chosenSkillsFromBackground: Array<{ skill: SkillKey; source: ProficiencySource }> =
    backgroundSkillChoices.map((sk) => {
      const grant = allSkillGrants.find((g) => g.kind !== "fixed" && g.source.type === "background");
      return { skill: sk, source: grant?.source ?? { type: "background", name: "Background" } };
    });
  const chosenSkillsFromSpecies: Array<{ skill: SkillKey; source: ProficiencySource }> =
    speciesSkillChoices.map((sk) => {
      const grant = allSkillGrants.find((g) => g.kind !== "fixed" && g.source.type === "species");
      return { skill: sk, source: grant?.source ?? { type: "species", name: "Species" } };
    });
  const chosenSkillsFromFeats: Array<{ skill: SkillKey; source: ProficiencySource }> =
    Object.entries(featSkillChoices).flatMap(([idx, skills]) =>
      skills.map((sk) => ({
        skill: sk,
        source: { type: "feat" as const, name: `Feat slot ${Number(idx) + 1}` },
      })),
    );
  const chosenSkillsFromOriginFeat: Array<{ skill: SkillKey; source: ProficiencySource }> =
    originFeatSkillChoices.map((sk) => ({
      skill: sk,
      source: { type: "feat" as const, name: ORIGIN_FEAT_SOURCE_NAME },
    }));
  const chosenSkillsFromInvocationOriginFeats: Array<{
    skill: SkillKey;
    source: ProficiencySource;
  }> = Object.entries(optionalFeatureOriginFeatSkillChoices).flatMap(
    ([slotIndex, skills]) => {
      const slot = optionalFeatureOriginFeatSlots[Number(slotIndex)];
      const sourceName = slot
        ? formatInvocationOriginFeatSourceName(
            slot.sourceFeatureName,
            slot.duplicateIndex,
          )
        : ORIGIN_FEAT_SOURCE_NAME;
      return skills.map((sk) => ({
        skill: sk,
        source: { type: "feat" as const, name: sourceName },
      }));
    },
  );

  const resolvedSkillGrants = [
    ...fixedSkills,
    ...chosenSkillsFromClass,
    ...chosenSkillsFromBackground,
    ...chosenSkillsFromSpecies,
    ...chosenSkillsFromOriginFeat,
    ...chosenSkillsFromInvocationOriginFeats,
    ...chosenSkillsFromFeats,
  ];

  const fixedExpertise = resolveFixedExpertiseGrants(allExpertiseGrants);
  const chosenExpertise: Array<{ skill: SkillKey; source: ProficiencySource }> =
    Object.entries(expertiseChoices).flatMap(([grantId, skills]) =>
      skills.map((sk) => ({
        skill: sk,
        source: { type: "feature" as const, name: grantId },
      })),
    );
  const resolvedExpertiseGrants = [...fixedExpertise, ...chosenExpertise];

  return computeCharacterProficiencies(
    saveProficiencyAbilities,
    resolvedSkillGrants,
    resolvedExpertiseGrants,
    allSkillAdvantages,
  );
}
