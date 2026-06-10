import type { StatBlockContent } from "./statblock-content.types";

export interface MhDisease {
  id: string;
  name: string;
  source: string;
  page?: number;
  content: StatBlockContent[];
  summary: string;
}
