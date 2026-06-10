import type { StatBlockContent } from "./statblock-content.types";

export interface MhCondition {
  id: string;
  name: string;
  source: string;
  page?: number;
  content: StatBlockContent[];
  summary: string;
}
