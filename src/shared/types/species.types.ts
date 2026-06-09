import { AbilityKey, DamageType, Entry } from "./actor.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";

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

/** D&D 2024 background ASI: +2/+1 or +1/+1/+1 across a fixed set of abilities. */
export interface AbilityBonusWeightedDistribution {
  kind: "weightedDistribution";
  from: AbilityKey[];
  modes: Array<{ weights: number[]; label: string }>;
}

export type AbilityBonus =
  | AbilityBonusFixed
  | AbilityBonusChoose
  | AbilityBonusWeightedDistribution;

/** Distribution mode for 2024 background ability score increases. */
export type BackgroundAsiMode = "plus2plus1" | "plus1each";

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
  /** Structured skill proficiency grants for the builder. */
  skillGrants: import("./proficiency.types").SkillProficiencyGrant[];
  /** Skill advantage/disadvantage grants parsed from trait text. */
  skillAdvantages: import("./proficiency.types").SkillAdvantageGrant[];
  /** Origin / species feat grant (D&D 2024 Versatile, etc.). */
  originFeatGrant?: OriginFeatGrant | null;
  languageGrants: import("./proficiency.types").NamedProficiencyGrant[];
  defenseGrants: import("./proficiency.types").DefenseGrant[];
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
