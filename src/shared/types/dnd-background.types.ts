import type {
  BackgroundProficiencies,
  BackgroundSection,
} from "./background.types";
import type { AbilityBonus } from "./species.types";
import type { DndBackgroundFeatRef } from "./dnd-feat.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import type { StartingEquipmentOffers } from "./starting-equipment.types";

export type DndBackgroundEdition = "2014" | "2024";

export interface DndBackground {
  id: string;
  name: string;
  source: string;
  page?: number;
  edition?: DndBackgroundEdition;
  srd?: boolean;
  basicRules?: boolean;
  fluff: string;
  proficiencies: BackgroundProficiencies;
  abilityBonuses: AbilityBonus[];
  abilitySummary?: string;
  featSummary?: string;
  featRefs?: DndBackgroundFeatRef[];
  originFeatGrant?: OriginFeatGrant | null;
  features: BackgroundSection[];
  suggestedCharacteristics: BackgroundSection[];
  /** Populated only on deduplicated list rows */
  variantSources?: string[];
  variantCount?: number;
  searchText?: string;
  /** Structured skill proficiency grants for the builder. */
  skillGrants: import("./proficiency.types").SkillProficiencyGrant[];
  toolGrants: import("./proficiency.types").NamedProficiencyGrant[];
  languageGrants: import("./proficiency.types").NamedProficiencyGrant[];
  startingEquipmentOffers: StartingEquipmentOffers;
}

export const DND_BACKGROUND_EDITION_LABELS: Record<DndBackgroundEdition, string> = {
  "2014": "2014",
  "2024": "2024",
};
