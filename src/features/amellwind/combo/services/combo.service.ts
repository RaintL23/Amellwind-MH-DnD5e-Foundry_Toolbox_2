import { ComboToolTable, ComboRow } from "@/shared/types";
import { COMBO_TOOL_TABLES } from "../data/combo.data";

export function getAllComboTables(): ComboToolTable[] {
  return COMBO_TOOL_TABLES;
}

export function getComboTableById(id: string): ComboToolTable | undefined {
  return COMBO_TOOL_TABLES.find((t) => t.id === id);
}

export interface SearchResult {
  toolId: string;
  toolName: string;
  row: ComboRow;
}

export function searchAllComboRows(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  for (const table of COMBO_TOOL_TABLES) {
    for (const row of table.rows) {
      if (
        row.name.toLowerCase().includes(q) ||
        row.item1.toLowerCase().includes(q) ||
        row.item2.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q)
      ) {
        results.push({ toolId: table.id, toolName: table.toolName, row });
      }
    }
  }
  return results;
}

export function filterRows(rows: ComboRow[], query: string): ComboRow[] {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(q) ||
      row.item1.toLowerCase().includes(q) ||
      row.item2.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q),
  );
}
