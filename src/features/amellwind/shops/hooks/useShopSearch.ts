import { useMemo } from "react";
import { Shop, ShopEntry } from "@/shared/types";
import { SHOPS } from "../data/shops.data";

export type ShopSearchGroup = {
  shop: Shop;
  entries: { entry: ShopEntry; sectionIdx: number }[];
};

export function useShopSearch(query: string): ShopSearchGroup[] {
  const isSearching = query.trim().length > 0;

  return useMemo(() => {
    if (!isSearching) return [];
    const q = query.toLowerCase();
    const groups: ShopSearchGroup[] = [];

    for (const shop of SHOPS) {
      const matched: ShopSearchGroup["entries"] = [];
      shop.sections.forEach((section, sectionIdx) => {
        section.entries.forEach((entry) => {
          if (entry.name.toLowerCase().includes(q)) {
            matched.push({ entry, sectionIdx });
          }
        });
      });
      if (matched.length > 0) groups.push({ shop, entries: matched });
    }

    return groups;
  }, [query, isSearching]);
}

export function countShopItems(): number {
  return SHOPS.reduce(
    (sum, shop) =>
      sum + shop.sections.reduce((sectionSum, section) => sectionSum + section.entries.length, 0),
    0,
  );
}
