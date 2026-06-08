export interface FeatAbilityIncrease {
  /** e.g. "STR +1" or "INT or WIS +1 (choose)" */
  label: string;
}

export interface Feat {
  id: string;
  name: string;
  source: string;
  page?: number;
  prerequisites: string[];
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
