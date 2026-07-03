export type HuntPrepTableKey =
  | "signs"
  | "minorChallenges"
  | "majorChallenges"
  | "benefits";

export interface HuntPrepEntry {
  id: string;
  text: string;
}

export type HuntPrepTables = Record<HuntPrepTableKey, HuntPrepEntry[]>;

export interface HuntPrepTableMeta {
  key: HuntPrepTableKey;
  title: string;
  description: string;
  suggestedCount: string;
}

export const HUNT_PREP_TABLE_META: HuntPrepTableMeta[] = [
  {
    key: "signs",
    title: "Signs",
    description:
      "Clues tied to your quarry — tracks, kills, markings, and roars.",
    suggestedCount: "Generated from the target monster and environment.",
  },
  {
    key: "minorChallenges",
    title: "Minor Challenges",
    description:
      "Setbacks using local monsters from the environment stat block.",
    suggestedCount: "Filtered by encounter difficulty in setup.",
  },
  {
    key: "majorChallenges",
    title: "Major Challenges",
    description:
      "Dangerous threats drawn from harder local monsters and environment events.",
    suggestedCount: "Filtered by encounter difficulty in setup.",
  },
  {
    key: "benefits",
    title: "Benefits",
    description:
      "Boons including friendly NPCs, carvable corpses, and hunter caches.",
    suggestedCount: "Includes NPC details and carve targets.",
  },
];

export function createEmptyHuntPrepTables(): HuntPrepTables {
  return {
    signs: [],
    minorChallenges: [],
    majorChallenges: [],
    benefits: [],
  };
}

export function createPrepEntry(text = ""): HuntPrepEntry {
  return {
    id: `prep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
  };
}
