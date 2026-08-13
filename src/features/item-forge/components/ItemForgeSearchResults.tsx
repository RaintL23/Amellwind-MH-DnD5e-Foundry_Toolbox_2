import { Package, Search } from "lucide-react";
import type { RaintdmItem } from "../types/item-forge.types";
import type { ItemForgeSearchGroup } from "../hooks/useItemForgeSearch";
import { ItemForgeRow } from "./ItemForgeRow";

const HEADERS = [
  "Name",
  "Rarity",
  "Cost",
  "Weight",
  "Ingredient 1",
  "Ingredient 2",
  "DC",
  "Qty",
] as const;

export function ItemForgeSearchResults({
  results,
  query,
  selected,
  onSelect,
  itemDescMap,
}: {
  results: ItemForgeSearchGroup[];
  query: string;
  selected: RaintdmItem | null;
  onSelect: (item: RaintdmItem | null) => void;
  itemDescMap: Record<string, string>;
}) {
  const total = results.reduce((sum, group) => sum + group.items.length, 0);

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
        {total} item{total !== 1 ? "s" : ""} found across {results.length} type
        {results.length !== 1 ? "s" : ""}.
      </p>
      {results.map(({ type, items }) => (
        <div key={type} className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">{type}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {HEADERS.map((label) => (
                    <th
                      key={label}
                      className={
                        label === "DC" || label === "Qty"
                          ? "px-3 py-2.5 text-center font-semibold text-muted-foreground text-xs w-14"
                          : "px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs"
                      }
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ItemForgeRow
                    key={`${item.source}-${item.name}`}
                    item={item}
                    selected={selected?.name === item.name}
                    onSelect={() =>
                      onSelect(selected?.name === item.name ? null : item)
                    }
                    itemDescMap={itemDescMap}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
