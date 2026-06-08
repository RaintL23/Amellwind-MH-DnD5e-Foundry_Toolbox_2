export interface ClassTableGroup {
  title?: string;
  colLabels: string[];
  /** One row per class level (1–20), cell values as display strings */
  rows: string[][];
}

export interface ClassFeatureEntry {
  uid: string;
  name: string;
  displayName: string;
  level: number;
  source: string;
  /** Structured 5etools entries (lists, tables, sections). */
  content: import("./statblock-content.types").StatBlockContent[];
  /** Plain-text fallback for search and legacy consumers. */
  description: string[];
  isSubclassFeature?: boolean;
  gainSubclassFeature?: boolean;
}

export interface ClassLevelRow {
  level: number;
  features: ClassFeatureEntry[];
  /** Flattened table cell values across all classTableGroups for this level */
  tableCells: string[];
}

export interface SubclassSpellBlock {
  prepared?: Record<string, string[]>;
  known?: Record<string, string[]>;
  expanded?: Record<string, string[]>;
}

export interface Subclass {
  id: string;
  name: string;
  shortName: string;
  /** Book where the subclass was published (e.g. XGE, TCE) */
  source: string;
  /** Parent class book this subclass is linked to (e.g. PHB, XPHB) */
  classSource: string;
  edition?: "classic" | "one";
  page?: number;
  progression: ClassLevelRow[];
  additionalSpells?: SubclassSpellBlock[];
}

export interface ClassMetaListGroup {
  label: string;
  items: string[];
}

export interface Class {
  id: string;
  name: string;
  source: string;
  page?: number;
  edition?: "classic" | "one";
  isSidekick?: boolean;
  hitDie: string;
  proficiencies: string[];
  casterProgression?: string;
  spellcastingAbility?: string;
  spellProgression: ClassTableGroup[];
  progression: ClassLevelRow[];
  subclasses: Subclass[];
  startingProficiencies: ClassMetaListGroup[];
  startingEquipment: string[];
  multiclassing: string[];
  subclassTitle?: string;
  summary: string;
  variantSources?: string[];
  variantCount?: number;
  searchText?: string;
  /** Structured saving throw proficiencies (ability keys). */
  saveProficiencies: import("./actor.types").AbilityKey[];
  /** Structured skill choice grants for the builder. */
  skillChoiceGrants: import("./proficiency.types").SkillProficiencyGrant[];
}
