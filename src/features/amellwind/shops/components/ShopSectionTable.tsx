import { useState, useRef } from "react";
import { Shop, ShopEntry } from "@/shared/types";
import { useCart } from "../context/CartContext";
import { cn } from "@/shared/utils/cn";
import { AddToCartIconButton } from "./AddToCartIconButton";
import { ItemTooltip, type TooltipState } from "./ItemTooltip";

export function ShopSectionTable({
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
  const hasExtra = section.entries.some((entry) => entry.extra);

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
                    <AddToCartIconButton
                      inCart={inCart}
                      disabled={entry.craftOnly}
                      title={
                        entry.craftOnly
                          ? "Craft only"
                          : inCart
                            ? "Already in list"
                            : "Add to list"
                      }
                      onClick={() =>
                        addItem({
                          name: entry.name,
                          cost: entry.cost,
                          weight: entry.weight,
                          shopName,
                        })
                      }
                    />
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
