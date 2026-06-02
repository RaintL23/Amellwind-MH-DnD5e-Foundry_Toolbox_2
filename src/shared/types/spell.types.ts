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
  /** Nombres base de clase para filtrar (Bard, Wizard, Fighter, …) */
  classNames: string[];
  /** Etiquetas para mostrar (incluye subclases y variantes) */
  classes: string[];
  description: string[];
  higherLevel?: string;
  summary: string;
  /** Fuentes adicionales con el mismo nombre (solo en lista deduplicada) */
  variantSources?: string[];
  variantCount?: number;
  /** Texto agregado de todas las variantes para búsqueda en tabla */
  searchText?: string;
}
