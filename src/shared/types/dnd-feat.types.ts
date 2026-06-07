import type { Feat, FeatSection } from "./feat.types";

export type DndFeatCategory = "O" | "G" | "EB" | "D" | "FS" | "FS:R" | "FS:P" | string;

export interface DndFeat extends Feat {
  category?: DndFeatCategory;
  isOriginFeat: boolean;
  srd52?: boolean;
  basicRules2024?: boolean;
  /** Populated only on deduplicated list rows */
  variantSources?: string[];
  variantCount?: number;
  searchText?: string;
}

export interface DndBackgroundFeatRef {
  id: string;
  name: string;
  source: string;
  qualifier?: string;
  displayLabel: string;
}

export const DND_FEAT_CATEGORY_LABELS: Record<string, string> = {
  O: "Origin Feat",
  G: "General Feat",
  EB: "Epic Boon",
  D: "Dragonmark",
  FS: "Fighting Style",
  "FS:R": "Fighting Style (Ranger)",
  "FS:P": "Fighting Style (Paladin)",
};

export type { FeatSection };
