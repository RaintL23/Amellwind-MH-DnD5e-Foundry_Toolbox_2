import type { StatBlockContent } from "./statblock-content.types";

/** Classic D&D condition or status (5etools `condition` / `status`). */
export interface DndCondition {
  id: string;
  name: string;
  source: string;
  page?: number;
  content: StatBlockContent[];
  summary: string;
  category: "condition" | "status";
  variantSources?: string[];
}

/** Classic D&D disease (5etools `disease`). */
export interface DndDisease {
  id: string;
  name: string;
  source: string;
  page?: number;
  content: StatBlockContent[];
  summary: string;
  variantSources?: string[];
}
