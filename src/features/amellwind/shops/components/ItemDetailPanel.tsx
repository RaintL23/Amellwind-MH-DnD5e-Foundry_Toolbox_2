import { Check, ShoppingCart, X } from "lucide-react";
import { MHItem } from "@/shared/types";
import { parseEntries } from "@/shared/utils/fivetools-parser";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { formatValueGp } from "../services/item.service";
import { useCart } from "../context/CartContext";
import { RarityBadge } from "./RarityBadge";
import { DndRichText } from "@/shared/components/DndRichText";

export function ItemDetailPanel({
  item,
  onClose,
}: {
  item: MHItem;
  onClose: () => void;
}) {
  const { addItem, items: cartItems } = useCart();
  const inCart = cartItems.some((c) => c.name === item.name);
  const textEntries = item.entries
    .filter((entry) => typeof entry === "string")
    .map((entry) => parseEntries([entry]))
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
                <DndRichText text={text} />
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
