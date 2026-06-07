import type { AbilityBonus, SpeciesTrait } from "./species.types";
import type { DamageType } from "./actor.types";

export type DndRaceKind = "species" | "subrace" | "lineage";

export type DndRaceSize =
  | "Tiny"
  | "Small"
  | "Medium"
  | "Large"
  | "Huge"
  | "Gargantuan";

export interface DndRace {
  id: string;
  name: string;
  source: string;
  page?: number;
  kind: DndRaceKind;
  parentName?: string;
  parentSource?: string;
  sizes: DndRaceSize[];
  speed: string;
  abilityBonuses: AbilityBonus[];
  abilitySummary: string;
  darkvision?: number;
  resistances: DamageType[];
  resistanceSummary: string;
  traitTags: string[];
  traits: SpeciesTrait[];
  fluff: string;
  /** Populated only on deduplicated list rows */
  variantSources?: string[];
  variantCount?: number;
  searchText?: string;
}

export const DND_RACE_KIND_LABELS: Record<DndRaceKind, string> = {
  species: "Species",
  subrace: "Subrace",
  lineage: "Lineage",
};
