import type { GuideTable } from "./character-guide.types";

export type DowntimeTable = GuideTable & { caption?: string };

export type DowntimeContent =
  | { type: "paragraph"; text: string }
  | { type: "table"; table: DowntimeTable }
  | { type: "section"; name: string; children: DowntimeContent[] };

export interface DowntimeActivity {
  id: string;
  name: string;
  shortName: string;
  page?: number;
  content: DowntimeContent[];
}
