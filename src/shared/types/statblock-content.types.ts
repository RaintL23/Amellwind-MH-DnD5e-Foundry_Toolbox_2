import type { DowntimeTable } from "./downtime.types";

export type StatBlockListItem =
  | { type: "text"; text: string }
  | { type: "named"; name: string; children: StatBlockContent[] };

export type StatBlockContent =
  | { type: "paragraph"; text: string }
  | { type: "table"; table: DowntimeTable }
  | { type: "section"; name: string; children: StatBlockContent[] }
  | { type: "list"; items: StatBlockListItem[]; style?: string };

export interface SpellcastingSpellLine {
  label: string;
  spells: string[];
}
