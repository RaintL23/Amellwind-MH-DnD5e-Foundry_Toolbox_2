import type { AbilityBonus, SpeciesTrait } from "./species.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import type { DamageType } from "./actor.types";

export type DndRaceKind = "species" | "subrace" | "lineage";

/**
 * A named spell-group choice offered by a species trait (e.g. Tiefling Fiendish Legacy).
 * The player must pick one group; each group grants different cantrips and a specific resistance.
 */
export interface SpeciesLineageInnateSpell {
  /** Display name (e.g. "Speak with Animals"). */
  name: string;
  /** Character level at which this innate spell unlocks. */
  unlockedAtCharacterLevel: number;
}

export interface SpeciesNamedSpellGroup {
  /** Display name (e.g. "Abyssal", "Chthonic", "Infernal"). */
  name: string;
  /** Cantrips granted specifically by this group (display names, e.g. "Poison Spray"). */
  cantrips: string[];
  /** Damage resistance linked to this group (e.g. "poison"). */
  resistance?: DamageType;
  /** Always-prepared innate spells (e.g. Speak with Animals for Forest Gnome). */
  innateSpells?: SpeciesLineageInnateSpell[];
  /** Parsed trait text for this lineage option (5etools markup already resolved). */
  entries?: string[];
}

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
  /** Structured skill proficiency grants for the builder. */
  skillGrants: import("./proficiency.types").SkillProficiencyGrant[];
  /** Skill advantage/disadvantage grants parsed from trait text. */
  skillAdvantages: import("./proficiency.types").SkillAdvantageGrant[];
  /** Origin feat from species traits (e.g. Human Versatile). */
  originFeatGrant?: OriginFeatGrant | null;
  languageGrants: import("./proficiency.types").NamedProficiencyGrant[];
  defenseGrants: import("./proficiency.types").DefenseGrant[];
  /**
   * Mutually-exclusive named spell groups the player must choose from
   * (e.g. Tiefling Fiendish Legacy: Abyssal / Chthonic / Infernal).
   * Only present when the species has 2+ named additionalSpells entries.
   */
  namedSpellGroups?: SpeciesNamedSpellGroup[];
  /** Trait label for the lineage picker (e.g. "Fiendish Legacy", "Gnomish Lineage"). */
  namedSpellGroupsLabel?: string;
  /**
   * Cantrips always granted regardless of group choice
   * (e.g. Thaumaturgy from Tiefling's Otherworldly Presence).
   */
  universalCantrips?: string[];
}

export const DND_RACE_KIND_LABELS: Record<DndRaceKind, string> = {
  species: "Species",
  subrace: "Subrace",
  lineage: "Lineage",
};
