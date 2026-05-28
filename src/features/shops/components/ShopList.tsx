import { useState, useEffect, useRef } from "react";
import { Shop, ShopEntry } from "@/shared/types";
import { SHOPS } from "../data/shops.data";
import { getAllItems } from "../services/item.service";
import { useCart } from "../context/CartContext";
import { CartDrawer } from "./CartDrawer";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Check,
  ChevronDown,
  ChevronRight,
  Store,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

function parseEntryText(entry: unknown): string {
  if (typeof entry === "string") {
    return entry.replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1");
  }
  return "";
}

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
              {section.entries.some((e) => e.extra) && (
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
                  {section.entries.some((e) => e.extra) && (
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

function ShopCard({
  shop,
  itemDescMap,
}: {
  shop: Shop;
  itemDescMap: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Shop header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">
            {shop.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {shop.description}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs">
            {shop.sections.reduce((sum, s) => sum + s.entries.length, 0)} items
          </Badge>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Requirement warning */}
          {shop.requirement && (
            <div className="flex items-start gap-2 px-5 py-3 bg-amber-900/10 border-b border-amber-700/20 text-amber-300/80 text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{shop.requirement}</span>
            </div>
          )}

          {/* Tables */}
          <div className="divide-y divide-border/50">
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
      )}
    </div>
  );
}

export function ShopList() {
  const [itemDescMap, setItemDescMap] = useState<Record<string, string>>({});

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Shops</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {SHOPS.length} shops available in the Monster Hunter world
        </p>
      </div>

      {/* Shop cards */}
      <div className="space-y-4">
        {SHOPS.map((shop) => (
          <ShopCard key={shop.id} shop={shop} itemDescMap={itemDescMap} />
        ))}
      </div>

      <CartDrawer />
    </div>
  );
}
