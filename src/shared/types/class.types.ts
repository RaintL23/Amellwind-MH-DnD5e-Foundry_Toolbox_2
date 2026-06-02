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
  page?: number;
  progression: ClassLevelRow[];
  additionalSpells?: SubclassSpellBlock[];
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
  startingProficiencies: string[];
  startingEquipment: string[];
  multiclassing: string[];
  subclassTitle?: string;
  summary: string;
  variantSources?: string[];
  variantCount?: number;
  searchText?: string;
}
