import { useMemo } from "react";
import { MHItem } from "@/shared/types";

export type ItemSearchGroup = { type: string; items: MHItem[] };

export function useItemSearch(items: MHItem[], query: string): ItemSearchGroup[] {
  const isSearching = query.trim().length > 0;

  return useMemo(() => {
    if (!isSearching) return [];
    const q = query.toLowerCase();
    const grouped: Record<string, MHItem[]> = {};

    for (const item of items) {
      if (item.name.toLowerCase().includes(q)) {
        if (!grouped[item.typeLabel]) grouped[item.typeLabel] = [];
        grouped[item.typeLabel].push(item);
      }
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, typeItems]) => ({ type, items: typeItems }));
  }, [items, query, isSearching]);
}
