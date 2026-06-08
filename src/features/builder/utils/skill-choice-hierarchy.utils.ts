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

export type SkillPickerScope =
  | { type: "species" }
  | { type: "background" }
  | { type: "class"; grantIndex: number }
  | { type: "feat"; slotIndex: number };

export interface CrossPickerChoiceState {
  speciesChoices: SkillKey[];
  speciesSource: ProficiencySource;
  backgroundChoices: SkillKey[];
  backgroundSource: ProficiencySource;
  classChoices: Record<number, SkillKey[]>;
  classChooseGrants: SkillProficiencyGrant[];
  featChoices: Record<number, SkillKey[]>;
  featChooseGrants: SkillProficiencyGrant[];
}

/**
 * Skills already picked in another choose/any picker (any priority).
 * Used to disable duplicate picks across Species / Background / Class / Feat lists
 * before proficiency is finalized.
 */
export function skillsChosenInOtherPickers(
  scope: SkillPickerScope,
  state: CrossPickerChoiceState,
): Partial<Record<SkillKey, ProficiencySource[]>> {
  const result: Partial<Record<SkillKey, ProficiencySource[]>> = {};

  const add = (skill: SkillKey, source: ProficiencySource) => {
    if (!result[skill]) result[skill] = [];
    result[skill]!.push(source);
  };

  if (scope.type !== "species") {
    for (const skill of state.speciesChoices) {
      add(skill, state.speciesSource);
    }
  }

  if (scope.type !== "background") {
    for (const skill of state.backgroundChoices) {
      add(skill, state.backgroundSource);
    }
  }

  for (const [idx, choices] of Object.entries(state.classChoices)) {
    const grantIndex = Number(idx);
    if (scope.type === "class" && scope.grantIndex === grantIndex) continue;
    const grant = state.classChooseGrants[grantIndex];
    const source = grant?.source ?? { type: "class" as const, name: "Class" };
    for (const skill of choices) {
      add(skill, source);
    }
  }

  for (const [idx, choices] of Object.entries(state.featChoices)) {
    const slotIndex = Number(idx);
    if (scope.type === "feat" && scope.slotIndex === slotIndex) continue;
    const grant = state.featChooseGrants[slotIndex];
    const source = grant?.source ?? { type: "feat" as const, name: "Feat" };
    for (const skill of choices) {
      add(skill, source);
    }
  }

  return result;
}
