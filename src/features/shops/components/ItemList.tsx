import { useState, useEffect, useMemo } from "react";
import { MHItem } from "@/shared/types";
import { getAllItems, formatValueGp } from "../services/item.service";
import { useCart } from "../context/CartContext";
import { CartDrawer } from "./CartDrawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Search,
  ShoppingCart,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

const DEFAULT_PAGE_SIZE = 15;

type SortKey = "name" | "type" | "value";
type SortDir = "asc" | "desc";

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
    <div className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300 translate-x-0">
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
        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {item.typeLabel}
          </Badge>
          <RarityBadge rarity={item.rarity} />
        </div>

        {/* Stats */}
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

        {/* Description */}
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
            This item cannot be purchased; it must be crafted from the combinations list.
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

export function ItemList() {
  const [items, setItems] = useState<MHItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "name",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<MHItem | null>(null);

  const { addItem, items: cartItems } = useCart();

  useEffect(() => {
    getAllItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const uniqueTypes = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.typeLabel))).sort(),
    [items],
  );

  const uniqueRarities = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((i) => i.rarity)
            .filter((r) => r && r !== "none"),
        ),
      ).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    let result = items;

    if (nameFilter)
      result = result.filter((i) =>
        i.name.toLowerCase().includes(nameFilter.toLowerCase()),
      );
    if (typeFilter) result = result.filter((i) => i.typeLabel === typeFilter);
    if (rarityFilter) result = result.filter((i) => i.rarity === rarityFilter);

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sort.key === "name") cmp = a.name.localeCompare(b.name);
      else if (sort.key === "type")
        cmp = a.typeLabel.localeCompare(b.typeLabel);
      else if (sort.key === "value")
        cmp = (a.valueCp ?? -1) - (b.valueCp ?? -1);
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, nameFilter, typeFilter, rarityFilter, sort]);

  function resetPage() {
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col)
      return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">
          Loading items…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Items</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} of {items.length} AGMH items
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              resetPage();
            }}
            className="pl-8"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            resetPage();
          }}
        >
          <option value="">All types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Select
          value={rarityFilter}
          onChange={(e) => {
            setRarityFilter(e.target.value);
            resetPage();
          }}
        >
          <option value="">All rarities</option>
          {uniqueRarities.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {(
                  [
                    { key: "name", label: "Name" },
                    { key: "type", label: "Type" },
                  ] as Array<{ key: SortKey; label: string }>
                ).map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Rarity
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort("value")}
                >
                  <span className="flex items-center gap-1">
                    Cost <SortIcon col="value" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Weight
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => {
                const inCart = cartItems.some((c) => c.name === item.name);
                return (
                  <tr
                    key={`${item.source}-${item.name}`}
                    className={cn(
                      "border-b border-border/50 hover:bg-muted/30 transition-colors",
                      selected?.name === item.name && "bg-primary/10",
                    )}
                  >
                    <td
                      className="px-4 py-3 font-medium text-foreground cursor-pointer"
                      onClick={() =>
                        setSelected((prev) =>
                          prev?.name === item.name ? null : item,
                        )
                      }
                    >
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {item.typeLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <RarityBadge rarity={item.rarity} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {item.valueCp !== null ? (
                        <span className="text-primary font-semibold">
                          {formatValueGp(item.valueCp)}
                        </span>
                      ) : (
                        <span className="text-amber-400/70 text-xs italic">
                          Craft only
                        </span>
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
                            weight:
                              item.weight !== null
                                ? `${item.weight} lb.`
                                : "—",
                            source: "Items",
                          });
                        }}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                          inCart
                            ? "text-green-400 bg-green-900/30 border border-green-700/50 cursor-default"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30",
                        )}
                        disabled={inCart}
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
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No items found matching the applied filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* Item detail side panel */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <ItemDetailPanel
            item={selected}
            onClose={() => setSelected(null)}
          />
        </>
      )}

      <CartDrawer />
    </div>
  );
}
