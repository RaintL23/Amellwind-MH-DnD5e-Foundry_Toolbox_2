import { getPendingDefenseChoiceGrants } from "@/shared/utils/defense-grant.parser";
import { getPendingNamedChoiceGrants } from "@/shared/utils/named-proficiency.parser";
import {
  getPendingChoiceGrants,
  getPendingExpertiseGrants,
} from "../compute-character-proficiencies";
import {
  ORIGIN_FEAT_SOURCE_NAME,
  formatInvocationOriginFeatSourceName,
  isInvocationOriginFeatSourceName,
} from "../origin-feat.constants";
import { skillsFromHigherPriority } from "../skill-choice-hierarchy.utils";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";
import {
  isDefensePickerComplete,
  isNamedPickerComplete,
  isSkillPickerComplete,
} from "./helpers";

export function evaluateProficienciesCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  const speciesGrantList = input.allSkillGrants.filter(
    (grant) => grant.source.type === "species",
  );
  const bgGrantList = input.allSkillGrants.filter(
    (grant) => grant.source.type === "background",
  );
  const classGrantList = input.allSkillGrants.filter(
    (grant) => grant.source.type === "class",
  );

  const pendingSkills = getPendingChoiceGrants(input.allSkillGrants);
  const speciesGrants = pendingSkills.filter((grant) => grant.source.type === "species");
  const bgGrants = pendingSkills.filter((grant) => grant.source.type === "background");
  const classGrants = pendingSkills.filter((grant) => grant.source.type === "class");
  const originFeatGrants = pendingSkills.filter(
    (grant) =>
      grant.source.type === "feat" && grant.source.name === ORIGIN_FEAT_SOURCE_NAME,
  );
  const invocationOriginFeatGrants = pendingSkills.filter(
    (grant) =>
      grant.source.type === "feat" &&
      isInvocationOriginFeatSourceName(grant.source.name),
  );
  const classFeatGrants = pendingSkills.filter(
    (grant) =>
      grant.source.type === "feat" &&
      grant.source.name !== ORIGIN_FEAT_SOURCE_NAME &&
      !isInvocationOriginFeatSourceName(grant.source.name),
  );

  const higherThanSpecies = skillsFromHigherPriority(
    "species",
    [],
    [],
    [],
    [],
    [],
    [],
  );
  const higherThanBackground = skillsFromHigherPriority(
    "background",
    speciesGrantList,
    input.speciesSkillChoices,
    [],
    [],
    [],
    [],
  );
  const higherThanClass = skillsFromHigherPriority(
    "class",
    speciesGrantList,
    input.speciesSkillChoices,
    bgGrantList,
    input.backgroundSkillChoices,
    [],
    [],
  );
  const flatClassSkillChoices = Object.values(input.classSkillChoices).flat();
  const higherThanFeat = skillsFromHigherPriority(
    "feat",
    speciesGrantList,
    input.speciesSkillChoices,
    bgGrantList,
    input.backgroundSkillChoices,
    classGrantList,
    flatClassSkillChoices,
  );

  if (
    speciesGrants.length > 0 &&
    !isSkillPickerComplete(
      speciesGrants,
      input.speciesSkillChoices,
      higherThanSpecies,
    )
  ) {
    issues.push({
      id: "skills-species",
      section: "skills",
      message: "Complete species skill choices",
      highlightKey: "species",
    });
  }

  if (
    bgGrants.length > 0 &&
    !isSkillPickerComplete(
      bgGrants,
      input.backgroundSkillChoices,
      higherThanBackground,
    )
  ) {
    issues.push({
      id: "skills-background",
      section: "skills",
      message: "Complete background skill choices",
      highlightKey: "background",
    });
  }

  classGrants.forEach((grant, grantIndex) => {
    if (
      isSkillPickerComplete([grant], input.classSkillChoices[grantIndex] ?? [], higherThanClass)
    ) {
      return;
    }
    issues.push({
      id: `skills-class-${grantIndex}`,
      section: "skills",
      message:
        classGrants.length > 1
          ? `Complete class skill choices (${grantIndex + 1}/${classGrants.length})`
          : "Complete class skill choices",
      highlightKey: `class-${grantIndex}`,
    });
  });

  if (
    originFeatGrants.length > 0 &&
    !isSkillPickerComplete(
      originFeatGrants,
      input.originFeatSkillChoices,
      higherThanFeat,
    )
  ) {
    issues.push({
      id: "skills-origin-feat",
      section: "skills",
      message: "Complete origin feat skill choices",
      highlightKey: "origin-feat",
    });
  }

  input.optionalFeatureOriginFeatSlots.forEach((slotMeta) => {
    const sourceName = formatInvocationOriginFeatSourceName(
      slotMeta.sourceFeatureName,
      slotMeta.duplicateIndex,
    );
    const grants = invocationOriginFeatGrants.filter(
      (grant) => grant.source.name === sourceName,
    );
    if (!grants.length) return;
    const chosen = input.optionalFeatureOriginFeatSkillChoices[slotMeta.slotIndex] ?? [];
    if (isSkillPickerComplete(grants, chosen, higherThanFeat)) return;
    issues.push({
      id: `skills-opt-origin-feat-${slotMeta.slotIndex}`,
      section: "skills",
      message: `Complete skill choices for ${sourceName}`,
      highlightKey: sourceName,
    });
  });

  classFeatGrants.forEach((grant, index) => {
    if (
      isSkillPickerComplete(
        [grant],
        input.featSkillChoices[index] ?? [],
        higherThanFeat,
      )
    ) {
      return;
    }
    issues.push({
      id: `skills-feat-${index}`,
      section: "skills",
      message: `Complete skill choices for feat: ${grant.source.name}`,
      highlightKey: `feat-${index}`,
    });
  });

  getPendingExpertiseGrants(input.allExpertiseGrants).forEach((grant, index) => {
    const grantId = `${grant.source.name}-${index}`;
    const chosen = input.expertiseChoices[grantId] ?? [];
    if (chosen.length >= grant.count) return;
    issues.push({
      id: `expertise-${grantId}`,
      section: "skills",
      message: `Choose ${grant.count - chosen.length} more expertise skill${grant.count - chosen.length === 1 ? "" : "s"} (${grant.source.name})`,
      highlightKey: grantId,
    });
  });

  const pendingTools = getPendingNamedChoiceGrants(input.allToolGrants);
  const pendingToolBySource = {
    species: pendingTools.filter((grant) => grant.source.type === "species"),
    background: pendingTools.filter((grant) => grant.source.type === "background"),
    class: pendingTools.filter((grant) => grant.source.type === "class"),
  };

  if (
    pendingToolBySource.species.length > 0 &&
    !isNamedPickerComplete(pendingToolBySource.species, input.speciesToolChoices)
  ) {
    issues.push({
      id: "tools-species",
      section: "tools",
      message: "Complete species tool proficiencies",
      highlightKey: "species",
    });
  }

  if (
    pendingToolBySource.background.length > 0 &&
    !isNamedPickerComplete(pendingToolBySource.background, input.backgroundToolChoices)
  ) {
    issues.push({
      id: "tools-background",
      section: "tools",
      message: "Complete background tool proficiencies",
      highlightKey: "background",
    });
  }

  pendingToolBySource.class.forEach((grant, grantIndex) => {
    if (
      isNamedPickerComplete([grant], input.classToolChoices[grantIndex] ?? [])
    ) {
      return;
    }
    issues.push({
      id: `tools-class-${grantIndex}`,
      section: "tools",
      message:
        pendingToolBySource.class.length > 1
          ? `Complete class tool proficiencies (${grantIndex + 1}/${pendingToolBySource.class.length})`
          : "Complete class tool proficiencies",
      highlightKey: `class-${grantIndex}`,
    });
  });

  const pendingLanguages = getPendingNamedChoiceGrants(input.allLanguageGrants);
  const pendingLanguageBySource = {
    species: pendingLanguages.filter((grant) => grant.source.type === "species"),
    background: pendingLanguages.filter((grant) => grant.source.type === "background"),
    class: pendingLanguages.filter((grant) => grant.source.type === "class"),
  };

  if (
    pendingLanguageBySource.species.length > 0 &&
    !isNamedPickerComplete(
      pendingLanguageBySource.species,
      input.speciesLanguageChoices,
    )
  ) {
    issues.push({
      id: "languages-species",
      section: "languages",
      message: "Complete species language choices",
      highlightKey: "species",
    });
  }

  if (
    pendingLanguageBySource.background.length > 0 &&
    !isNamedPickerComplete(
      pendingLanguageBySource.background,
      input.backgroundLanguageChoices,
    )
  ) {
    issues.push({
      id: "languages-background",
      section: "languages",
      message: "Complete background language choices",
      highlightKey: "background",
    });
  }

  pendingLanguageBySource.class.forEach((grant, grantIndex) => {
    if (
      isNamedPickerComplete([grant], input.classLanguageChoices[grantIndex] ?? [])
    ) {
      return;
    }
    issues.push({
      id: `languages-class-${grantIndex}`,
      section: "languages",
      message:
        pendingLanguageBySource.class.length > 1
          ? `Complete class language choices (${grantIndex + 1}/${pendingLanguageBySource.class.length})`
          : "Complete class language choices",
      highlightKey: `class-${grantIndex}`,
    });
  });

  getPendingDefenseChoiceGrants(input.allDefenseGrants).forEach(
    (grant, grantIndex) => {
      const chosen = input.speciesDefenseChoices[grantIndex] ?? [];
      if (isDefensePickerComplete([grant], chosen)) return;
      issues.push({
        id: `defenses-${grantIndex}`,
        section: "defenses",
        message: `Complete species ${grant.defenseKind} choices`,
        highlightKey: `defense-${grantIndex}`,
      });
    },
  );

  return issues;
}
