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
  formatPickMessage,
  isDefensePickerComplete,
  isNamedPickerComplete,
  isSkillPickerComplete,
  namedPickerProgress,
  skillPickerProgress,
} from "./helpers";

const SKILL_NOUN = { one: "skill", many: "skills" };
const TOOL_NOUN = { one: "tool proficiency", many: "tool proficiencies" };
const WEAPON_NOUN = { one: "weapon proficiency", many: "weapon proficiencies" };
const LANGUAGE_NOUN = { one: "language", many: "languages" };

function fromSource(
  kind: "class" | "species" | "background",
  name: string | undefined,
): string {
  return name ? `from your ${name} ${kind}` : `from your ${kind}`;
}

/** Disambiguates classes that grant several separate pick groups. */
function withGroup(from: string, index: number, groupCount: number): string {
  return groupCount > 1 ? `${from} (set ${index + 1} of ${groupCount})` : from;
}

export function evaluateProficienciesCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];
  const fromSpecies = fromSource("species", input.species?.name);
  const fromBackground = fromSource("background", input.background?.name);
  const fromClass = fromSource("class", input.classSelection?.name);

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
      message: formatPickMessage(
        skillPickerProgress(speciesGrants, input.speciesSkillChoices, higherThanSpecies),
        SKILL_NOUN,
        fromSpecies,
      ),
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
      message: formatPickMessage(
        skillPickerProgress(bgGrants, input.backgroundSkillChoices, higherThanBackground),
        SKILL_NOUN,
        fromBackground,
      ),
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
      message: formatPickMessage(
        skillPickerProgress(
          [grant],
          input.classSkillChoices[grantIndex] ?? [],
          higherThanClass,
        ),
        SKILL_NOUN,
        withGroup(fromClass, grantIndex, classGrants.length),
      ),
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
      message: formatPickMessage(
        skillPickerProgress(originFeatGrants, input.originFeatSkillChoices, higherThanFeat),
        SKILL_NOUN,
        "from your origin feat",
      ),
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
      message: formatPickMessage(
        skillPickerProgress(grants, chosen, higherThanFeat),
        SKILL_NOUN,
        `from ${sourceName}`,
      ),
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
      message: formatPickMessage(
        skillPickerProgress([grant], input.featSkillChoices[index] ?? [], higherThanFeat),
        SKILL_NOUN,
        `from the ${grant.source.name} feat`,
      ),
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
      message: formatPickMessage(
        namedPickerProgress(pendingToolBySource.species, input.speciesToolChoices),
        TOOL_NOUN,
        fromSpecies,
      ),
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
      message: formatPickMessage(
        namedPickerProgress(pendingToolBySource.background, input.backgroundToolChoices),
        TOOL_NOUN,
        fromBackground,
      ),
      highlightKey: "background",
    });
  }

  const pendingFeatTools = pendingTools.filter((grant) => grant.source.type === "feat");
  pendingFeatTools.forEach((grant, grantIndex) => {
    if (isNamedPickerComplete([grant], input.featToolChoices[grantIndex] ?? [])) {
      return;
    }
    issues.push({
      id: `tools-feat-${grantIndex}`,
      section: "tools",
      message: formatPickMessage(
        namedPickerProgress([grant], input.featToolChoices[grantIndex] ?? []),
        TOOL_NOUN,
        `from ${grant.source.name}`,
      ),
      highlightKey: `feat-tool-${grantIndex}`,
    });
  });

  const pendingWeapons = getPendingNamedChoiceGrants(input.allWeaponGrants);
  const speciesWeaponGrants = pendingWeapons.filter(
    (grant) => grant.source.type === "species",
  );
  const classWeaponGrants = pendingWeapons.filter(
    (grant) => grant.source.type === "class",
  );
  const featWeaponGrants = pendingWeapons.filter(
    (grant) => grant.source.type === "feat",
  );

  if (
    speciesWeaponGrants.length > 0 &&
    !isNamedPickerComplete(speciesWeaponGrants, input.speciesWeaponChoices)
  ) {
    issues.push({
      id: "weapons-species",
      section: "tools",
      message: formatPickMessage(
        namedPickerProgress(speciesWeaponGrants, input.speciesWeaponChoices),
        WEAPON_NOUN,
        fromSpecies,
      ),
      highlightKey: "species-weapons",
    });
  }

  classWeaponGrants.forEach((grant, grantIndex) => {
    if (
      isNamedPickerComplete([grant], input.classWeaponChoices[grantIndex] ?? [])
    ) {
      return;
    }
    issues.push({
      id: `weapons-class-${grantIndex}`,
      section: "tools",
      message: formatPickMessage(
        namedPickerProgress([grant], input.classWeaponChoices[grantIndex] ?? []),
        WEAPON_NOUN,
        withGroup(fromClass, grantIndex, classWeaponGrants.length),
      ),
      highlightKey: `class-weapon-${grantIndex}`,
    });
  });

  featWeaponGrants.forEach((grant, grantIndex) => {
    if (
      isNamedPickerComplete([grant], input.featWeaponChoices[grantIndex] ?? [])
    ) {
      return;
    }
    issues.push({
      id: `weapons-feat-${grantIndex}`,
      section: "tools",
      message: formatPickMessage(
        namedPickerProgress([grant], input.featWeaponChoices[grantIndex] ?? []),
        WEAPON_NOUN,
        `from ${grant.source.name}`,
      ),
      highlightKey: `feat-weapon-${grantIndex}`,
    });
  });

  pendingToolBySource.class.forEach((grant, grantIndex) => {
    if (
      isNamedPickerComplete([grant], input.classToolChoices[grantIndex] ?? [])
    ) {
      return;
    }
    issues.push({
      id: `tools-class-${grantIndex}`,
      section: "tools",
      message: formatPickMessage(
        namedPickerProgress([grant], input.classToolChoices[grantIndex] ?? []),
        TOOL_NOUN,
        grant.source.isSubclass
          ? `from ${grant.source.name}`
          : withGroup(fromClass, grantIndex, pendingToolBySource.class.length),
      ),
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
      message: formatPickMessage(
        namedPickerProgress(pendingLanguageBySource.species, input.speciesLanguageChoices),
        LANGUAGE_NOUN,
        fromSpecies,
      ),
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
      message: formatPickMessage(
        namedPickerProgress(
          pendingLanguageBySource.background,
          input.backgroundLanguageChoices,
        ),
        LANGUAGE_NOUN,
        fromBackground,
      ),
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
      message: formatPickMessage(
        namedPickerProgress([grant], input.classLanguageChoices[grantIndex] ?? []),
        LANGUAGE_NOUN,
        withGroup(fromClass, grantIndex, pendingLanguageBySource.class.length),
      ),
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
        message: `Pick ${grant.count - Math.min(chosen.length, grant.count)} damage type${grant.count - Math.min(chosen.length, grant.count) === 1 ? "" : "s"} for your species ${grant.defenseKind} (${Math.min(chosen.length, grant.count)}/${grant.count})`,
        highlightKey: `defense-${grantIndex}`,
      });
    },
  );

  return issues;
}
