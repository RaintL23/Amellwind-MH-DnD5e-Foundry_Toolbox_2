import { useMemo } from "react";
import type { RaintdmItem } from "../types/item-forge.types";

export type ItemForgeSearchGroup = { type: string; items: RaintdmItem[] };

function matchesQuery(item: RaintdmItem, q: string): boolean {
  if (item.name.toLowerCase().includes(q)) return true;
  const crafting = item.crafting;
  if (!crafting) return false;
  return (
    crafting.item1.toLowerCase().includes(q) ||
    crafting.item2.toLowerCase().includes(q) ||
    crafting.tool.toLowerCase().includes(q)
  );
}

export function useItemForgeSearch(
  items: RaintdmItem[],
  query: string,
): ItemForgeSearchGroup[] {
  const isSearching = query.trim().length > 0;

  return useMemo(() => {
    if (!isSearching) return [];
    const q = query.toLowerCase();
    const grouped: Record<string, RaintdmItem[]> = {};

    for (const item of items) {
      if (!matchesQuery(item, q)) continue;
      if (!grouped[item.typeLabel]) grouped[item.typeLabel] = [];
      grouped[item.typeLabel].push(item);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, typeItems]) => ({ type, items: typeItems }));
  }, [items, query, isSearching]);
}
