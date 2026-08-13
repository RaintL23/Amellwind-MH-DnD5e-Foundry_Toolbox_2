import { X, Plus, Minus } from "lucide-react";
import { CartEntry } from "@/shared/types";
import { formatTotalGp, parseCostGp } from "../utils/cost.utils";

export function CartItemRow({
  entry,
  onRemove,
  onUpdateQuantity,
}: {
  entry: CartEntry;
  onRemove: (name: string) => void;
  onUpdateQuantity: (name: string, quantity: number) => void;
}) {
  const lineCost = parseCostGp(entry.cost) * entry.quantity;

  return (
    <li className="rounded-lg border border-border bg-muted/20 p-3">
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
                  × {entry.quantity} = {formatTotalGp(lineCost)}
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
          onClick={() => onRemove(entry.name)}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          aria-label={`Remove ${entry.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => onUpdateQuantity(entry.name, entry.quantity - 1)}
          className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center text-sm font-medium text-foreground">
          {entry.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(entry.name, entry.quantity + 1)}
          className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}
