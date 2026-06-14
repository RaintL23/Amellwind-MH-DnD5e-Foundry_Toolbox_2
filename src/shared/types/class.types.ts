export interface ClassTableGroup {
  title?: string;
  colLabels: string[];
  /** One row per class level (1–20), cell values as display strings */
  rows: string[][];
}

import type { DndOptionalFeatureRef } from "./dnd-optionalfeature.types";

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
  /** Explicit optional-feature refs from {@code options} blocks in this feature. */
  optionalFeatureRefs?: DndOptionalFeatureRef[];
  /** Explicit feat refs from {@code refFeat} blocks (e.g. Blessed Warrior). */
  featRefs?: DndOptionalFeatureRef[];
}

export interface ClassLevelRow {
  level: number;
  features: ClassFeatureEntry[];
  /** Flattened table cell values across all classTableGroups for this level */
  tableCells: string[];
}

/** String spell ref or 5etools `{ choose: "level=1|class=Wizard" }` filter object. */
export type SubclassSpellEntry = string | { choose?: string; all?: string };

export interface SubclassSpellBlock {
  prepared?: Record<string, SubclassSpellEntry[]>;
  known?: Record<string, SubclassSpellEntry[]>;
  expanded?: Record<string, unknown[]>;
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
  /** Third-caster progression (e.g. Eldritch Knight, Arcane Trickster). */
  casterProgression?: string;
  spellcastingAbility?: string;
  cantripProgression?: number[];
  preparedSpells?: string;
  preparedSpellsProgression?: number[];
  spellsKnownProgressionFixed?: number[];
  spellProgression?: ClassTableGroup[];
  additionalSpells?: SubclassSpellBlock[];
  optionalFeatureProgressions?: import("./dnd-optionalfeature.types").OptionalFeatureProgression[];
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
  /** Cantrips known per character level (index 0 = level 1). Length 20. */
  cantripProgression?: number[];
  /** Formula string for prepared-spell count, e.g. "<$level$> + <$int_mod$>" */
  preparedSpells?: string;
  /** Fixed prepared-spell count per character level (2024 rules). Length 20. */
  preparedSpellsProgression?: number[];
  /** Fixed spells-known count per character level for known casters. Length 20. */
  spellsKnownProgressionFixed?: number[];
  spellProgression: ClassTableGroup[];
  progression: ClassLevelRow[];
  subclasses: Subclass[];
  startingProficiencies: ClassMetaListGroup[];
  startingEquipment: string[];
  startingEquipmentOffers: import("./starting-equipment.types").StartingEquipmentOffers;
  multiclassing: string[];
  /** Ability score minimums to multiclass into this class (e.g. str: 13). */
  multiclassRequirements?: Partial<
    Record<import("./actor.types").AbilityKey, number>
  >;
  /** Proficiencies gained when multiclassing into this class (not first class). */
  multiclassProficiencies?: {
    armorGrants: import("./proficiency.types").NamedProficiencyGrant[];
    weaponGrants: import("./proficiency.types").NamedProficiencyGrant[];
    toolGrants: import("./proficiency.types").NamedProficiencyGrant[];
    skillChoiceGrants: import("./proficiency.types").SkillProficiencyGrant[];
  };
  subclassTitle?: string;
  summary: string;
  variantSources?: string[];
  variantCount?: number;
  searchText?: string;
  /** Structured saving throw proficiencies (ability keys). */
  saveProficiencies: import("./actor.types").AbilityKey[];
  /** Structured skill choice grants for the builder. */
  skillChoiceGrants: import("./proficiency.types").SkillProficiencyGrant[];
  /** Tool / gaming set proficiencies for the builder. */
  toolGrants: import("./proficiency.types").NamedProficiencyGrant[];
  /** Armor proficiencies for the builder (from startingProficiencies.armor). */
  armorGrants: import("./proficiency.types").NamedProficiencyGrant[];
  /** Weapon proficiencies for the builder (from startingProficiencies.weapons). */
  weaponGrants: import("./proficiency.types").NamedProficiencyGrant[];
  /** Language proficiencies for the builder. */
  languageGrants: import("./proficiency.types").NamedProficiencyGrant[];
  optionalFeatureProgressions?: import("./dnd-optionalfeature.types").OptionalFeatureProgression[];
}
