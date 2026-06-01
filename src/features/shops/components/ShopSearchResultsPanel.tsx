import { Search, Store } from "lucide-react";
import { Shop } from "@/shared/types";
import { ShopSearchGroup } from "../hooks/useShopSearch";
import { ShopSectionTable } from "./ShopSectionTable";

export function ShopSearchResultsPanel({
  groups,
  query,
  itemDescMap,
}: {
  groups: ShopSearchGroup[];
  query: string;
  itemDescMap: Record<string, string>;
}) {
  const total = groups.reduce((sum, group) => sum + group.entries.length, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">No results</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          No items found for &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {total} item{total !== 1 ? "s" : ""} found across {groups.length} shop
        {groups.length !== 1 ? "s" : ""}.
      </p>
      {groups.map(({ shop, entries }) => {
        const syntheticSection: Shop["sections"][number] = {
          caption: undefined,
          entries: entries.map((e) => e.entry),
        };

        return (
          <div
            key={shop.id}
            className="rounded-lg border border-border overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
              <Store className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                {shop.name}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {entries.length} item{entries.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ShopSectionTable
              section={syntheticSection}
              shopName={shop.name}
              itemDescMap={itemDescMap}
            />
          </div>
        );
      })}
    </div>
  );
}
