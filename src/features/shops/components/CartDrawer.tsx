import { useState } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { cn } from "@/shared/utils/cn";

const GP_RATES: Record<string, number> = {
  pp: 10,
  gp: 1,
  sp: 0.1,
  cp: 0.01,
};

function parseCostGp(cost: string): number {
  if (!cost || cost === "—") return 0;
  const match = cost.replace(/,/g, "").match(/([\d.]+)\s*(pp|gp|sp|cp)/i);
  if (!match) return 0;
  const amount = parseFloat(match[1]);
  const rate = GP_RATES[match[2].toLowerCase()] ?? 1;
  return amount * rate;
}

function formatTotalGp(gp: number): string {
  if (gp === 0) return "—";
  if (gp >= 1000) return `${gp.toLocaleString("en-US")} gp`;
  return `${gp % 1 === 0 ? gp : gp.toFixed(2)} gp`;
}

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, totalItems, removeItem, updateQuantity, clearCart } =
    useCart();

  const totalGp = items.reduce(
    (sum, entry) => sum + parseCostGp(entry.cost) * entry.quantity,
    0,
  );

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="text-sm font-semibold">{totalItems}</span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Shopping List
            </h2>
            {totalItems > 0 && (
              <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-xs font-semibold">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Clear list"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Your list is empty.
              </p>
              <p className="text-xs text-muted-foreground/60">
                Add items from the item list or shops.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((entry) => (
                <li
                  key={entry.name}
                  className="rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-primary font-medium">
                          {entry.cost}
                          {entry.quantity > 1 && parseCostGp(entry.cost) > 0 && (
                            <span className="text-muted-foreground font-normal ml-1">
                              × {entry.quantity} = {formatTotalGp(parseCostGp(entry.cost) * entry.quantity)}
                            </span>
                          )}
                        </span>
                        {entry.weight && entry.weight !== "—" && (
                          <span className="text-xs text-muted-foreground">
                            {entry.weight}
                          </span>
                        )}
                        {entry.shopName && (
                          <span className="text-xs text-muted-foreground/60 italic truncate">
                            {entry.shopName}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(entry.name)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      aria-label={`Remove ${entry.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(entry.name, entry.quantity - 1)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-accent text-muted-foreground transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-foreground">
                      {entry.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(entry.name, entry.quantity + 1)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-accent text-muted-foreground transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-border px-5 py-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{items.length} item type(s)</span>
              <span>{totalItems} unit(s) total</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-sm font-bold text-primary">
                {formatTotalGp(totalGp)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60 italic">
              This list is for reference only during the current session.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
