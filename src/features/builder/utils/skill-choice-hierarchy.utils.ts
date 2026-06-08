import type { SkillKey } from "@/shared/types";
import type {
  ProficiencySource,
  ProficiencySourceType,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import { resolveFixedGrants } from "./compute-character-proficiencies";
import { sourcePriority } from "./proficiency-source-styles";

/** Resolved skills from fixed grants + player choices for one identity source. */
export function resolvedSkillsForSource(
  grants: SkillProficiencyGrant[],
  choices: SkillKey[],
  sourceType: ProficiencySourceType,
  fallbackName: string,
): Array<{ skill: SkillKey; source: ProficiencySource }> {
  const fixed = resolveFixedGrants(grants);
  const fromChoices = choices.map((skill) => ({
    skill,
    source: {
      type: sourceType,
      name: fallbackName,
    } satisfies ProficiencySource,
  }));
  return [...fixed, ...fromChoices];
}

/** All skills granted by sources with higher priority than `pickerType`. */
export function skillsFromHigherPriority(
  pickerType: ProficiencySourceType,
  speciesGrants: SkillProficiencyGrant[],
  speciesChoices: SkillKey[],
  bgGrants: SkillProficiencyGrant[],
  bgChoices: SkillKey[],
  classGrants: SkillProficiencyGrant[],
  classChoices: SkillKey[],
): Partial<Record<SkillKey, ProficiencySource[]>> {
  const pickerRank = sourcePriority(pickerType);
  const buckets: Array<{ skills: Array<{ skill: SkillKey; source: ProficiencySource }> }> =
    [];

  if (sourcePriority("species") < pickerRank) {
    buckets.push({
      skills: resolvedSkillsForSource(
        speciesGrants,
        speciesChoices,
        "species",
        "Species",
      ),
    });
  }
  if (sourcePriority("background") < pickerRank) {
    buckets.push({
      skills: resolvedSkillsForSource(
        bgGrants,
        bgChoices,
        "background",
        "Background",
      ),
    });
  }
  if (sourcePriority("class") < pickerRank) {
    buckets.push({
      skills: resolvedSkillsForSource(
        classGrants,
        classChoices,
        "class",
        "Class",
      ),
    });
  }

  const result: Partial<Record<SkillKey, ProficiencySource[]>> = {};
  for (const { skills } of buckets) {
    for (const { skill, source } of skills) {
      if (!result[skill]) result[skill] = [];
      result[skill]!.push(source);
    }
  }
  return result;
}

/** Remove choices that are already covered by a higher-priority source. */
export function pruneChoicesByHierarchy(
  choices: SkillKey[],
  coveredByHigher: Set<SkillKey>,
): SkillKey[] {
  return choices.filter((s) => !coveredByHigher.has(s));
}
