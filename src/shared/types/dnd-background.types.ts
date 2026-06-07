import type {
  BackgroundProficiencies,
  BackgroundSection,
} from "./background.types";

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
  abilitySummary?: string;
  featSummary?: string;
  features: BackgroundSection[];
  suggestedCharacteristics: BackgroundSection[];
  /** Populated only on deduplicated list rows */
  variantSources?: string[];
  variantCount?: number;
  searchText?: string;
}

export const DND_BACKGROUND_EDITION_LABELS: Record<DndBackgroundEdition, string> = {
  "2014": "2014",
  "2024": "2024",
};
