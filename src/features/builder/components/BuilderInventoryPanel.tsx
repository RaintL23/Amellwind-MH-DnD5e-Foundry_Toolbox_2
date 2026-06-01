import { Package, ShoppingBag } from "lucide-react";
import { useCart } from "@/features/shops/context/CartContext";
import { cn } from "@/shared/utils/cn";

export function BuilderInventoryPanel() {
  const { items, totalItems } = useCart();

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col w-full xl:w-[240px] xl:shrink-0 h-fit">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Inventario
        </h2>
        {totalItems > 0 && (
          <span className="ml-auto rounded-full bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5">
            {totalItems}
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
        Objetos añadidos desde las tiendas. Equípalos cuando el builder lo
        permita.
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <ShoppingBag className="h-8 w-8 opacity-30" />
          <p className="text-xs text-center px-2">Vacío — compra en Shops</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
          {items.map((entry) => (
            <li
              key={entry.name}
              className={cn(
                "rounded-md border border-border bg-muted/20 px-2.5 py-2",
              )}
            >
              <p className="text-xs font-medium text-foreground leading-tight truncate">
                {entry.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {entry.cost && entry.cost !== "—" && (
                  <span className="text-[10px] text-primary">{entry.cost}</span>
                )}
                {entry.quantity > 1 && (
                  <span className="text-[10px] text-muted-foreground">
                    ×{entry.quantity}
                  </span>
                )}
              </div>
              {entry.shopName && (
                <p className="text-[9px] text-muted-foreground/70 truncate mt-0.5">
                  {entry.shopName}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
