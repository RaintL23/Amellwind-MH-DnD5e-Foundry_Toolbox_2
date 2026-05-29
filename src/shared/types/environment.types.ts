import type { ResourceCategory } from "./resource.types";

export interface EncounterRow {
  roll: string;
  description: string;
}

export interface ResourceColumn {
  category: ResourceCategory;
  dc: number;
}

export interface ResourceRow {
  roll: string;
  items: string[];
}

export interface LevelTierResourceTable {
  columns: ResourceColumn[];
  rows: ResourceRow[];
}

export interface LevelTier {
  levelRange: string;
  commonSmallMonsters: string;
  commonLargeMonsters: string;
  resources: LevelTierResourceTable;
  encounters: EncounterRow[];
}

export interface SpecialRule {
  name: string;
  description: string;
}

export interface WeatherRow {
  roll: string;
  weather: string;
}

export interface Environment {
  name: string;
  biome: string;
  navigationDC: number;
  encounterDC: number;
  investigationDC: number;
  totalResources: number;
  commonWeather: string;
  specialRules: SpecialRule[];
  weatherTable?: WeatherRow[];
  levelTiers: LevelTier[];
}

export const ENVIRONMENT_COLORS: Record<string, { accent: string; bg: string; border: string; badge: string }> = {
  "Ancestral Steppes": {
    accent: "text-emerald-400",
    bg: "from-emerald-950/60 to-emerald-900/40",
    border: "border-emerald-700/50",
    badge: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  },
  "The Dunes": {
    accent: "text-amber-400",
    bg: "from-amber-950/60 to-amber-900/40",
    border: "border-amber-700/50",
    badge: "bg-amber-900/50 text-amber-300 border-amber-700",
  },
  Jungle: {
    accent: "text-green-400",
    bg: "from-green-950/60 to-green-900/40",
    border: "border-green-700/50",
    badge: "bg-green-900/50 text-green-300 border-green-700",
  },
  Ocean: {
    accent: "text-cyan-400",
    bg: "from-cyan-950/60 to-cyan-900/40",
    border: "border-cyan-700/50",
    badge: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
  },
  "Snowy Mountains": {
    accent: "text-sky-300",
    bg: "from-sky-950/60 to-sky-900/40",
    border: "border-sky-600/50",
    badge: "bg-sky-900/50 text-sky-200 border-sky-600",
  },
  "Verdant Hills": {
    accent: "text-lime-400",
    bg: "from-lime-950/60 to-lime-900/40",
    border: "border-lime-700/50",
    badge: "bg-lime-900/50 text-lime-300 border-lime-700",
  },
  Volcano: {
    accent: "text-red-400",
    bg: "from-red-950/60 to-red-900/40",
    border: "border-red-700/50",
    badge: "bg-red-900/50 text-red-300 border-red-700",
  },
  "The Wetlands": {
    accent: "text-teal-400",
    bg: "from-teal-950/60 to-teal-900/40",
    border: "border-teal-700/50",
    badge: "bg-teal-900/50 text-teal-300 border-teal-700",
  },
};
