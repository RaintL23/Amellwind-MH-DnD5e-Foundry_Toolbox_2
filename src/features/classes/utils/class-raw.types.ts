export const DEFAULT_CLASS_SOURCE = "PHB";

export interface ClassFileDocument {
  _meta?: { internalCopies?: string[] };
  class?: RawClassDefinition[];
  subclass?: RawSubclassDefinition[];
  classFeature?: RawClassFeature[];
  subclassFeature?: RawSubclassFeature[];
}

export interface RawClassDefinition {
  name: string;
  source: string;
  page?: number;
  edition?: "classic" | "one";
  srd?: boolean;
  reprintedAs?: string[];
  isSidekick?: boolean;
  hd?: { number: number; faces: number };
  proficiency?: string[];
  casterProgression?: string;
  spellcastingAbility?: string;
  cantripProgression?: number[];
  preparedSpells?: string;
  classTableGroups?: RawClassTableGroup[];
  startingProficiencies?: RawStartingProficiencies;
  startingEquipment?: RawStartingEquipment;
  multiclassing?: RawMulticlassing;
  classFeatures?: (string | ClassFeatureRef)[];
  subclassTitle?: string;
  /** Filled after processing */
  subclasses?: ProcessedSubclass[];
  classFeaturesByLevel?: ResolvedFeature[][];
}

export interface ClassFeatureRef {
  classFeature: string;
  gainSubclassFeature?: boolean;
  tableDisplayName?: string;
}

export interface SubclassFeatureRef {
  subclassFeature: string;
  gainSubclassFeature?: boolean;
  tableDisplayName?: string;
}

export interface RawSubclassDefinition {
  name: string;
  shortName: string;
  source: string;
  className: string;
  classSource?: string;
  page?: number;
  edition?: "classic" | "one";
  reprintedAs?: string[];
  additionalSpells?: SubclassSpellBlockRaw[];
  subclassTableGroups?: RawClassTableGroup[];
  subclassFeatures?: (string | SubclassFeatureRef)[];
  isReprinted?: boolean;
  _copy?: Record<string, unknown>;
}

export interface SubclassSpellBlockRaw {
  prepared?: Record<string, string[]>;
  known?: Record<string, string[]>;
  expanded?: Record<string, string[]>;
}

export interface RawClassFeature {
  name: string;
  source: string;
  className: string;
  classSource?: string;
  level: number;
  entries?: unknown[];
  header?: number;
}

export interface RawSubclassFeature {
  name: string;
  source: string;
  className: string;
  classSource?: string;
  subclassShortName: string;
  subclassSource?: string;
  level: number;
  entries?: unknown[];
  header?: number;
}

export interface RawClassTableGroup {
  title?: string;
  colLabels?: string[];
  rows?: (number | string)[][];
  rowsSpellProgression?: (number | string)[][];
}

export interface RawStartingProficiencies {
  armor?: string[];
  weapons?: string[];
  tools?: string[];
  skills?: Array<{ choose?: { from?: string[]; count?: number } } | string>;
  languages?: string[];
}

export interface RawStartingEquipment {
  default?: string[];
  goldAlternative?: string;
  additionalFromBackground?: boolean;
}

export interface RawMulticlassing {
  requirements?: Record<string, number>;
  proficienciesGained?: RawStartingProficiencies;
  prerequisites?: unknown[];
}

export interface ResolvedFeature {
  name: string;
  source: string;
  className: string;
  classSource: string;
  level: number;
  entries: unknown[];
  displayName: string;
  gainSubclassFeature?: boolean;
  tableDisplayName?: string;
}

export interface ProcessedSubclass extends RawSubclassDefinition {
  subclassFeaturesByLevel: ResolvedFeature[][];
}

export type SubclassLookup = Record<
  string,
  Record<
    string,
    Record<string, Record<string, { name: string; isReprinted?: boolean }>>
  >
>;
