import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { MHItem } from "@/shared/types";
import { ItemsTable } from "./ItemsTable";

export function ItemsTab({
  items,
  selected,
  onSelect,
}: {
  items: MHItem[];
  selected: MHItem | null;
  onSelect: (item: MHItem | null) => void;
}) {
  const [localSearch, setLocalSearch] = useState("");

  const filtered = useMemo(() => {
    if (!localSearch.trim()) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(localSearch.toLowerCase()),
    );
  }, [items, localSearch]);

  return (
    <div>
      <div className="rounded-lg border border-border bg-card p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="flex-1 text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""} in this category
        </p>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter by name…"
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ItemsTable items={filtered} selected={selected} onSelect={onSelect} />
    </div>
  );
}
