import { CartEntry } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { formatTotalGp, parseCostGp } from "../utils/cost.utils";

export function CartSummary({
  items,
  onPurchase,
}: {
  items: CartEntry[];
  onPurchase?: () => void;
}) {
  const totalItems = items.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalGp = items.reduce(
    (sum, entry) => sum + parseCostGp(entry.cost) * entry.quantity,
    0,
  );

  return (
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
      {onPurchase && (
        <Button className="w-full" size="sm" onClick={onPurchase}>
          Comprar
        </Button>
      )}
      <p className="text-xs text-muted-foreground/60 italic">
        Al comprar, los objetos se añaden al inventario del Builder.
      </p>
    </div>
  );
}
