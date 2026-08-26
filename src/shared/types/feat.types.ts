import type { AbilityKey } from "./actor.types";

/** Prerequisite facets used for list filtering / badges. */
export type FeatPrerequisiteKind =
  | "level"
  | "ability"
  | "race"
  | "feat"
  | "feature"
  | "proficiency"
  | "spellcasting"
  | "campaign"
  | "background"
  | "other";

export interface FeatAbilityIncrease {
  /** e.g. "STR +1" or "INT or WIS +1 (choose)" */
  label: string;
  /** Ability scores this increase can apply to. */
  abilities: AbilityKey[];
  /** Score points granted (usually 1). */
  amount: number;
}

/** One ability score floor inside a prerequisite alternative. */
export interface FeatPrerequisiteAbilityReq {
  ability: AbilityKey;
  min: number;
}

/**
 * One OR-branch from 5etools `prerequisite[]`.
 * Ability alternatives within the branch are OR; each alternative is AND of its reqs.
 * Groups with unverified requirements never auto-qualify (randomizer / eligibility).
 */
export interface FeatPrerequisiteCheckGroup {
  level?: number;
  /** OR of ability alternatives; each alternative is AND of its score floors. */
  abilityAlternatives: FeatPrerequisiteAbilityReq[][];
  hasUnverifiedRequirements: boolean;
}

export interface Feat {
  id: string;
  name: string;
  source: string;
  page?: number;
  prerequisites: string[];
  /** Distinct prerequisite kinds present on this feat (for filters). */
  prerequisiteKinds: FeatPrerequisiteKind[];
  /** Numeric character level prerequisites (e.g. 4 for "Level 4+"). */
  prerequisiteLevels: number[];
  /**
   * Structured OR-groups for eligibility checks (empty = no prerequisites).
   * Prefer this over parsing `prerequisites` labels.
   */
  prerequisiteCheckGroups: FeatPrerequisiteCheckGroup[];
  abilityIncreases: FeatAbilityIncrease[];
  paragraphs: string[];
  /** Subsecciones con título (p. ej. opciones de shells, notas del creador) */
  sections: FeatSection[];
  repeatable: boolean;
  summary: string;
  /** Structured skill proficiency grants (from 5etools data when available). */
  skillGrants: import("./proficiency.types").SkillProficiencyGrant[];
  /** Expertise grants (from 5etools data when available). */
  expertiseGrants: import("./proficiency.types").ExpertiseGrant[];
}

export interface FeatSection {
  name?: string;
  paragraphs: string[];
}
