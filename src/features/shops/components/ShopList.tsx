import { useState, useEffect, useRef, useMemo } from "react";
import { Shop, ShopEntry } from "@/shared/types";
import { SHOPS } from "../data/shops.data";
import { getAllItems } from "../services/item.service";
import { useCart } from "../context/CartContext";
import { CartDrawer } from "./CartDrawer";
import {
  ShoppingCart,
  Check,
  Store,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

function parseEntryText(entry: unknown): string {
  if (typeof entry === "string") {
    return entry.replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1");
  }
  return "";
}

// ── Tooltip ───────────────────────────────────────────────────────────────

type TooltipState = { x: number; y: number; text: string } | null;

function ItemTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;
  return (
    <div
      className="fixed z-50 max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg pointer-events-none"
      style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
    >
      {tooltip.text}
    </div>
  );
}

// ── Tabla de sección de tienda ────────────────────────────────────────────

function ShopSectionTable({
  section,
  shopName,
  itemDescMap,
}: {
  section: Shop["sections"][number];
  shopName: string;
  itemDescMap: Record<string, string>;
}) {
  const { addItem, items: cartItems } = useCart();
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasExtra = section.entries.some((e) => e.extra);

  return (
    <>
      <ItemTooltip tooltip={tooltip} />
      <div className="overflow-x-auto">
        {section.caption && (
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2 bg-muted/30 border-b border-border">
            {section.caption}
          </h4>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Category
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Item
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Cost
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Weight
              </th>
              {hasExtra && (
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Details
                </th>
              )}
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {section.entries.map((entry: ShopEntry, i) => {
              const inCart = cartItems.some((c) => c.name === entry.name);
              const hasDesc = Boolean(itemDescMap[entry.name]);
              return (
                <tr
                  key={`${entry.name}-${i}`}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-2.5 text-xs text-muted-foreground/70">
                    {entry.category ?? ""}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 font-medium text-foreground",
                      hasDesc && "cursor-help",
                    )}
                    onMouseEnter={
                      hasDesc
                        ? (e) => {
                            if (tooltipTimeout.current)
                              clearTimeout(tooltipTimeout.current);
                            tooltipTimeout.current = setTimeout(() => {
                              setTooltip({
                                x: e.clientX,
                                y: e.clientY,
                                text: itemDescMap[entry.name],
                              });
                            }, 300);
                          }
                        : undefined
                    }
                    onMouseMove={
                      hasDesc
                        ? (e) => {
                            if (tooltip) {
                              setTooltip((prev) =>
                                prev
                                  ? { ...prev, x: e.clientX, y: e.clientY }
                                  : prev,
                              );
                            }
                          }
                        : undefined
                    }
                    onMouseLeave={
                      hasDesc
                        ? () => {
                            if (tooltipTimeout.current)
                              clearTimeout(tooltipTimeout.current);
                            setTooltip(null);
                          }
                        : undefined
                    }
                  >
                    {entry.name}
                    {hasDesc && (
                      <span className="ml-1.5 inline-block h-3 w-3 rounded-full bg-primary/20 text-primary text-[9px] font-bold leading-3 text-center align-middle select-none">
                        ?
                      </span>
                    )}
                    {entry.craftOnly && (
                      <span className="ml-2 text-xs italic text-amber-400/70">
                        *craft only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        entry.craftOnly
                          ? "text-muted-foreground/50 italic text-xs"
                          : "text-primary",
                      )}
                    >
                      {entry.cost}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {entry.weight}
                  </td>
                  {hasExtra && (
                    <td className="px-4 py-2.5 text-xs text-muted-foreground/70 max-w-xs">
                      {entry.extra ?? ""}
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() =>
                        addItem({
                          name: entry.name,
                          cost: entry.cost,
                          weight: entry.weight,
                          shopName,
                        })
                      }
                      disabled={inCart || entry.craftOnly}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                        entry.craftOnly
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : inCart
                            ? "text-green-400 bg-green-900/30 border border-green-700/50 cursor-default"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30",
                      )}
                      title={
                        entry.craftOnly
                          ? "Craft only"
                          : inCart
                            ? "Already in list"
                            : "Add to list"
                      }
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
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Tab de una tienda concreta ────────────────────────────────────────────

function ShopTab({
  shop,
  itemDescMap,
}: {
  shop: Shop;
  itemDescMap: Record<string, string>;
}) {
  const totalItems = shop.sections.reduce((sum, s) => sum + s.entries.length, 0);

  return (
    <div>
      {/* Shop info header */}
      <div className="rounded-lg border border-border bg-card p-4 mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-foreground">{shop.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {shop.description} · {totalItems} item{totalItems !== 1 ? "s" : ""}
          </p>
          {shop.requirement && (
            <div className="flex items-start gap-1.5 mt-2 text-amber-300/80 text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{shop.requirement}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border/50">
        {shop.sections.map((section, i) => (
          <ShopSectionTable
            key={i}
            section={section}
            shopName={shop.name}
            itemDescMap={itemDescMap}
          />
        ))}
      </div>
    </div>
  );
}

// ── Panel de búsqueda global ──────────────────────────────────────────────

type SearchGroup = { shop: Shop; entries: { entry: ShopEntry; sectionIdx: number }[] };

function SearchResultsPanel({
  groups,
  query,
  itemDescMap,
}: {
  groups: SearchGroup[];
  query: string;
  itemDescMap: Record<string, string>;
}) {
  const total = groups.reduce((sum, g) => sum + g.entries.length, 0);

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
        // Reconstruct a synthetic section from matched entries
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

// ── Componente principal ──────────────────────────────────────────────────

export function ShopList() {
  const [itemDescMap, setItemDescMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>(SHOPS[0]?.id ?? "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllItems().then((items) => {
      const map: Record<string, string> = {};
      items.forEach((item) => {
        const desc = item.entries
          .map((e) => parseEntryText(e))
          .filter(Boolean)
          .join(" ");
        if (desc) map[item.name] = desc;
      });
      setItemDescMap(map);
    });
  }, []);

  const isSearching = search.trim().length > 0;

  const searchGroups = useMemo<SearchGroup[]>(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
    const groups: SearchGroup[] = [];
    for (const shop of SHOPS) {
      const matched: SearchGroup["entries"] = [];
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
  }, [search, isSearching]);

  const activeShop = SHOPS.find((s) => s.id === activeTab) ?? SHOPS[0];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearch("");
  };

  const totalItems = SHOPS.reduce(
    (sum, s) => sum + s.sections.reduce((ss, sec) => ss + sec.entries.length, 0),
    0,
  );

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Store className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Shops</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {SHOPS.length} shops · {totalItems} items available in the Monster Hunter world.
        </p>
      </div>

      {/* Global search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items across all shops…"
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
          groups={searchGroups}
          query={search}
          itemDescMap={itemDescMap}
        />
      ) : (
        <>
          {/* Tabs por tienda */}
          <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
            {SHOPS.map((shop) => (
              <button
                key={shop.id}
                onClick={() => handleTabChange(shop.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === shop.id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Store className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[140px]">{shop.name}</span>
              </button>
            ))}
          </div>

          {activeShop && (
            <ShopTab shop={activeShop} itemDescMap={itemDescMap} />
          )}
        </>
      )}

      <CartDrawer />
    </div>
  );
}
