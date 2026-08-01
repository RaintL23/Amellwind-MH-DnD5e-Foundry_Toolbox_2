export type SpellSchool =
  | "A"
  | "C"
  | "D"
  | "E"
  | "I"
  | "N"
  | "T"
  | "V"
  | string;

export interface SpellComponents {
  v: boolean;
  s: boolean;
  m?: string;
}

export interface Spell {
  id: string;
  name: string;
  source: string;
  page?: number;
  level: number;
  school: SpellSchool;
  schoolName: string;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  isRitual: boolean;
  isConcentration: boolean;
  /** Base class names for filtering (Bard, Wizard, Fighter, …) */
  classNames: string[];
  /** Labels to display (includes subclasses and variants) */
  classes: string[];
  description: string[];
  higherLevel?: string;
  summary: string;
  /** Fuentes adicionales con el mismo nombre (solo en lista deduplicada) */
  variantSources?: string[];
  variantCount?: number;
  /** Texto agregado de todas las variantes para búsqueda en tabla */
  searchText?: string;

  /** 5etools-style filter facets (components, miscTags, ritual, …). */
  filterTags: string[];
  damageTypes: string[];
  conditions: string[];
  spellAttack: string[];
  savingThrows: string[];
  castTimeUnits: string[];
  durationBucket: string;
  rangeBucket: string;
  areaStyles: string[];
}
