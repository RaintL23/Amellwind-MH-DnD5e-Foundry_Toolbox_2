import type { AbilityKey, SkillKey } from "@/shared/types";
import type {
  SkillProficiencyGrant,
  ExpertiseGrant,
  SkillAdvantageGrant,
  ProficiencySource,
} from "@/shared/types/proficiency.types";

export interface CharacterProficiencyInputs {
  /** Raw ability keys for save proficiencies (from class) */
  saveProficiencyAbilities: AbilityKey[];
  /** All skill grants from all sources (fixed and choose/any already resolved) */
  resolvedSkillGrants: Array<{ skill: SkillKey; source: ProficiencySource }>;
  /** Expertise grants already resolved to concrete skills */
  resolvedExpertiseGrants: Array<{ skill: SkillKey; source: ProficiencySource }>;
}

export interface CharacterProficiencyResult {
  /** For Character.savingThrows: presence of key means proficient */
  savingThrows: Partial<Record<AbilityKey, string>>;
  /** For Character.skills: 0=none, 1=proficient, 2=expertise */
  skills: Partial<Record<SkillKey, 0 | 1 | 2>>;
  /** Sources per skill (for tooltips) */
  skillSources: Partial<Record<SkillKey, ProficiencySource[]>>;
  /** Expertise sources per skill */
  expertiseSources: Partial<Record<SkillKey, ProficiencySource>>;
  /** Advantage/disadvantage grants */
  skillAdvantages: SkillAdvantageGrant[];
}

/**
 * Resolve grants that have concrete skills.
 * For "choose" and "any" grants the caller must supply resolved skills.
 */
export function resolveFixedGrants(
  grants: SkillProficiencyGrant[],
): Array<{ skill: SkillKey; source: ProficiencySource }> {
  const result: Array<{ skill: SkillKey; source: ProficiencySource }> = [];
  for (const grant of grants) {
    if (grant.kind === "fixed") {
      for (const skill of grant.skills) {
        result.push({ skill, source: grant.source });
      }
    }
  }
  return result;
}

/**
 * Resolve expertise grants that have concrete skills.
 */
export function resolveFixedExpertiseGrants(
  grants: ExpertiseGrant[],
): Array<{ skill: SkillKey; source: ProficiencySource }> {
  const result: Array<{ skill: SkillKey; source: ProficiencySource }> = [];
  for (const grant of grants) {
    if (grant.kind === "fixed") {
      for (const skill of grant.skills) {
        result.push({ skill, source: grant.source });
      }
    }
  }
  return result;
}

/**
 * Aggregate all resolved proficiencies into Character-compatible structures.
 */
export function computeCharacterProficiencies(
  saveProficiencyAbilities: AbilityKey[],
  resolvedSkillGrants: Array<{ skill: SkillKey; source: ProficiencySource }>,
  resolvedExpertiseGrants: Array<{ skill: SkillKey; source: ProficiencySource }>,
  skillAdvantages: SkillAdvantageGrant[],
): CharacterProficiencyResult {
  // Saving throws
  const savingThrows: Partial<Record<AbilityKey, string>> = {};
  for (const ability of saveProficiencyAbilities) {
    savingThrows[ability] = "proficient";
  }

  // Skills: accumulate sources, highest level wins
  const skillSources: Partial<Record<SkillKey, ProficiencySource[]>> = {};
  const skillLevels: Partial<Record<SkillKey, 0 | 1 | 2>> = {};

  for (const { skill, source } of resolvedSkillGrants) {
    if (!skillSources[skill]) skillSources[skill] = [];
    skillSources[skill]!.push(source);
    skillLevels[skill] = 1;
  }

  // Expertise (level 2) — only if already proficient
  const expertiseSources: Partial<Record<SkillKey, ProficiencySource>> = {};
  for (const { skill, source } of resolvedExpertiseGrants) {
    if (skillLevels[skill] === 1) {
      skillLevels[skill] = 2;
      expertiseSources[skill] = source;
    }
  }

  return {
    savingThrows,
    skills: skillLevels,
    skillSources,
    expertiseSources,
    skillAdvantages,
  };
}

/**
 * Get all "choose" / "any" grants that still need player selection.
 */
export function getPendingChoiceGrants(
  grants: SkillProficiencyGrant[],
): Array<
  | { kind: "choose"; from: SkillKey[]; count: number; source: ProficiencySource }
  | { kind: "any"; count: number; source: ProficiencySource }
> {
  return grants.filter(
    (g): g is Extract<SkillProficiencyGrant, { kind: "choose" | "any" }> =>
      g.kind === "choose" || g.kind === "any",
  );
}

/**
 * Get all expertise grants that still need player selection.
 */
export function getPendingExpertiseGrants(
  grants: ExpertiseGrant[],
): Array<{ kind: "chooseProficient"; count: number; source: ProficiencySource }> {
  return grants.filter(
    (g): g is Extract<ExpertiseGrant, { kind: "chooseProficient" }> =>
      g.kind === "chooseProficient",
  );
}
