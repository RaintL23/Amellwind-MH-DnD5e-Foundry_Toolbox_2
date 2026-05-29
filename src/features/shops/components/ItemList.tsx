import { useState, useEffect, useMemo } from "react";
import { MHItem } from "@/shared/types";
import { getAllItems, formatValueGp } from "../services/item.service";
import { useCart } from "../context/CartContext";
import { CartDrawer } from "./CartDrawer";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Check, Package, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const RARITY_COLORS: Record<string, string> = {
  none: "bg-gray-700/50 text-gray-300 border-gray-600",
  common: "bg-gray-700/50 text-gray-300 border-gray-600",
  uncommon: "bg-green-900/40 text-green-300 border-green-700",
  rare: "bg-blue-900/40 text-blue-300 border-blue-700",
  "very rare": "bg-purple-900/40 text-purple-300 border-purple-700",
  legendary: "bg-amber-900/40 text-amber-300 border-amber-700",
};

function RarityBadge({ rarity }: { rarity: string }) {
  const r = rarity.toLowerCase();
  if (r === "none") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
        RARITY_COLORS[r] ?? RARITY_COLORS["none"],
      )}
    >
      {rarity}
    </span>
  );
}

function parseEntryText(entry: unknown): string {
  if (typeof entry === "string") {
    return entry.replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1");
  }
  return "";
}

// ── Item detail side panel ────────────────────────────────────────────────

function ItemDetailPanel({
  item,
  onClose,
}: {
  item: MHItem;
  onClose: () => void;
}) {
  const { addItem, items: cartItems } = useCart();
  const inCart = cartItems.some((c) => c.name === item.name);
  const textEntries = item.entries
    .filter((e) => typeof e === "string")
    .map((e) => parseEntryText(e))
    .filter(Boolean);

  return (
    <div className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col bg-card border-l border-border shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
        <h2 className="text-base font-bold text-foreground truncate pr-2">
          {item.name}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 hover:bg-accent text-muted-foreground transition-colors shrink-0"
          aria-label="Close detail"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {item.typeLabel}
          </Badge>
          <RarityBadge rarity={item.rarity} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Cost</p>
            <p className="text-sm font-semibold text-primary">
              {formatValueGp(item.valueCp)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Weight</p>
            <p className="text-sm font-semibold text-foreground">
              {item.weight !== null ? `${item.weight} lb.` : "—"}
            </p>
          </div>
        </div>

        {textEntries.length > 0 && (
          <div className="space-y-2">
            {textEntries.map((text, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {text}
              </p>
            ))}
          </div>
        )}

        {item.valueCp === null && (
          <p className="text-xs text-amber-400/80 italic bg-amber-900/20 border border-amber-700/30 rounded-md px-3 py-2">
            This item cannot be purchased; it must be crafted from the
            combinations list.
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-5 py-4">
        <button
          onClick={() =>
            addItem({
              name: item.name,
              cost: formatValueGp(item.valueCp),
              weight: item.weight !== null ? `${item.weight} lb.` : "—",
              source: "Items",
            })
          }
          disabled={inCart}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            inCart
              ? "bg-green-900/30 text-green-400 border border-green-700/50 cursor-default"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {inCart ? (
            <>
              <Check className="h-4 w-4" /> In list
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Add to list
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Item row ──────────────────────────────────────────────────────────────

function ItemRow({
  item,
  selected,
  onSelect,
}: {
  item: MHItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { addItem, items: cartItems } = useCart();
  const inCart = cartItems.some((c) => c.name === item.name);

  return (
    <tr
      className={cn(
        "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
        selected && "bg-primary/10",
      )}
      onClick={onSelect}
    >
      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
      <td className="px-4 py-3">
        <RarityBadge rarity={item.rarity} />
      </td>
      <td className="px-4 py-3 font-mono text-xs">
        {item.valueCp !== null ? (
          <span className="text-primary font-semibold">
            {formatValueGp(item.valueCp)}
          </span>
        ) : (
          <span className="text-amber-400/70 italic">Craft only</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {item.weight !== null ? `${item.weight} lb.` : "—"}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem({
              name: item.name,
              cost: formatValueGp(item.valueCp),
              weight: item.weight !== null ? `${item.weight} lb.` : "—",
              source: "Items",
            });
          }}
          disabled={inCart}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            inCart
              ? "text-green-400 bg-green-900/30 border border-green-700/50 cursor-default"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30",
          )}
          title={inCart ? "Already in list" : "Add to list"}
        >
          {inCart ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <ShoppingCart className="h-3.5 w-3.5" />
          )}
        </button>
      </td>
    </tr>
  );
}

function ItemsTable({
  items,
  selected,
  onSelect,
  colSpan = 5,
}: {
  items: MHItem[];
  selected: MHItem | null;
  onSelect: (item: MHItem | null) => void;
  colSpan?: number;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Rarity
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Cost
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Weight
              </th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-10 text-center text-muted-foreground text-sm"
                >
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={`${item.source}-${item.name}`}
                  item={item}
                  selected={selected?.name === item.name}
                  onSelect={() =>
                    onSelect(selected?.name === item.name ? null : item)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab de un tipo concreto ───────────────────────────────────────────────

function ItemsTab({
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
    return items.filter((i) =>
      i.name.toLowerCase().includes(localSearch.toLowerCase()),
    );
  }, [items, localSearch]);

  return (
    <div>
      {/* Tab header */}
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

// ── Panel de resultados de búsqueda global ────────────────────────────────

function SearchResultsPanel({
  results,
  query,
  selected,
  onSelect,
}: {
  results: { type: string; items: MHItem[] }[];
  query: string;
  selected: MHItem | null;
  onSelect: (item: MHItem | null) => void;
}) {
  const total = results.reduce((sum, g) => sum + g.items.length, 0);

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
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                    Rarity
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                    Cost
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                    Weight
                  </th>
                  <th className="px-4 py-2.5 w-12" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ItemRow
                    key={`${item.source}-${item.name}`}
                    item={item}
                    selected={selected?.name === item.name}
                    onSelect={() =>
                      onSelect(selected?.name === item.name ? null : item)
                    }
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

// ── Componente principal ──────────────────────────────────────────────────

export function ItemList() {
  const [items, setItems] = useState<MHItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MHItem | null>(null);

  useEffect(() => {
    getAllItems().then((data) => {
      setItems(data);
      const types = Array.from(new Set(data.map((i) => i.typeLabel))).sort();
      if (types.length > 0) setActiveTab(types[0]);
      setLoading(false);
    });
  }, []);

  const uniqueTypes = useMemo(
    () => Array.from(new Set(items.map((i) => i.typeLabel))).sort(),
    [items],
  );

  const isSearching = search.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
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
  }, [items, search, isSearching]);

  const tabItems = useMemo(
    () => items.filter((i) => i.typeLabel === activeTab),
    [items, activeTab],
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearch("");
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">Loading items…</div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Package className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Items</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {items.length} AGMH items across {uniqueTypes.length} types.
        </p>
      </div>

      {/* Global search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items by name…"
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSearching ? (
        <SearchResultsPanel
          results={searchResults}
          query={search}
          selected={selected}
          onSelect={setSelected}
        />
      ) : (
        <>
          {/* Tabs por tipo */}
          <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleTabChange(type)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === type
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Package className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[120px]">{type}</span>
              </button>
            ))}
          </div>

          <ItemsTab
            items={tabItems}
            selected={selected}
            onSelect={setSelected}
          />
        </>
      )}

      {/* Item detail side panel */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <ItemDetailPanel item={selected} onClose={() => setSelected(null)} />
        </>
      )}

      <CartDrawer />
    </div>
  );
}
