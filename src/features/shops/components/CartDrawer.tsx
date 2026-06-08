import { useState } from "react";
import { ShoppingCart, X, Trash2 } from "lucide-react";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";
import { useCart } from "../context/CartContext";
import { cn } from "@/shared/utils/cn";
import { CartFloatingButton } from "./CartFloatingButton";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, totalItems, removeItem, updateQuantity, clearCart } =
    useCart();
  const { purchaseFromCart } = useBuilderInventory();

  const handlePurchase = () => {
    purchaseFromCart();
    setOpen(false);
  };

  return (
    <>
      <CartFloatingButton totalItems={totalItems} onOpen={() => setOpen(true)} />

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

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
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
                <CartItemRow
                  key={entry.name}
                  entry={entry}
                  onRemove={removeItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <CartSummary items={items} onPurchase={handlePurchase} />
        )}
      </div>
    </>
  );
}
