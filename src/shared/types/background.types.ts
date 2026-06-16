import { Entry } from "./actor.types";

import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";

export type BackgroundFaction = "hunters-guild" | "handlers-guild" | "wycademy";

export interface BackgroundTable {
  caption?: string;
  colLabels: string[];
  rows: string[][];
  /** Tipo inferido de la tabla de rasgos sugeridos. */
  rollKind?: "personality" | "ideal" | "bond" | "flaw" | "other";
}

export interface BackgroundSection extends Entry {
  tables?: BackgroundTable[];
}

export interface BackgroundProficiencies {
  skills: string;
  tools: string;
  languages: string;
  equipment: string;
}

export interface Background {
  id: string;
  name: string;
  source: string;
  page?: number;
  faction: BackgroundFaction;
  fluff: string;
  proficiencies: BackgroundProficiencies;
  features: BackgroundSection[];
  suggestedCharacteristics: BackgroundSection[];
  /** Structured skill proficiency grants for the builder. */
  skillGrants: import("./proficiency.types").SkillProficiencyGrant[];
  toolGrants: import("./proficiency.types").NamedProficiencyGrant[];
  languageGrants: import("./proficiency.types").NamedProficiencyGrant[];
  /** D&D 2024-style origin feat grant (all AGMH backgrounds). */
  originFeatGrant?: OriginFeatGrant | null;
}

export const BACKGROUND_FACTION_LABELS: Record<BackgroundFaction, string> = {
  "hunters-guild": "Hunters Guild",
  "handlers-guild": "Handlers",
  wycademy: "Wycademy",
};
