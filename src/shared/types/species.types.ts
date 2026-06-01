import { AbilityKey, DamageType, Entry } from "./actor.types";

export type SpeciesSize =
  | "Tiny"
  | "Small"
  | "Medium"
  | "Large"
  | "Huge"
  | "Gargantuan";

export type SpeciesCategory =
  | "ancestry"
  | "folk"
  | "elder-dragon"
  | "subrace"
  | "lineage";

export interface AbilityBonusFixed {
  kind: "fixed";
  bonuses: Partial<Record<AbilityKey, number>>;
}

export interface AbilityBonusChoose {
  kind: "choose";
  from: AbilityKey[];
  amount: number;
  count?: number;
}

export type AbilityBonus = AbilityBonusFixed | AbilityBonusChoose;

export interface SpeciesTable {
  caption?: string;
  colLabels: string[];
  rows: string[][];
}

export interface SpeciesTrait extends Entry {
  tables?: SpeciesTable[];
}

export interface Species {
  /** Identificador único (nombre + fuente + linaje padre si aplica). */
  id: string;
  name: string;
  source: string;
  page?: number;
  category: SpeciesCategory;
  isSubrace: boolean;
  parentSpecies?: string;
  parentSource?: string;
  sizes: SpeciesSize[];
  speed: string;
  abilityBonuses: AbilityBonus[];
  abilitySummary: string;
  darkvision?: number;
  resistances: DamageType[];
  /** Texto cuando la resistencia es a elegir (p. ej. dragonborn de dragón anciano). */
  resistanceSummary: string;
  traitTags: string[];
  traits: SpeciesTrait[];
  fluff: string;
}

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export const SPECIES_CATEGORY_LABELS: Record<SpeciesCategory, string> = {
  ancestry: "Ancestry",
  folk: "Folk",
  "elder-dragon": "Elder Dragonborn",
  subrace: "Subrace",
  lineage: "Lineage",
};
