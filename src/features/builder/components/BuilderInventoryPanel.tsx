import { Package, ShoppingBag, Sword, Shield, Box } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import type { CartItemKind } from "../utils/cart-equipment.resolver";

const KIND_LABEL: Record<CartItemKind, string> = {
  weapon: "Arma",
  armor: "Armadura",
  other: "Otro",
};

const KIND_ICON: Record<CartItemKind, typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  other: Box,
};

const KIND_STYLE: Record<CartItemKind, string> = {
  weapon: "text-red-400/90 bg-red-950/30 border-red-900/40",
  armor: "text-teal-400/90 bg-teal-950/30 border-teal-900/40",
  other: "text-muted-foreground bg-muted/30 border-border/60",
};

export function BuilderInventoryPanel() {
  const {
    cartItems,
    totalItems,
    equippableCount,
    isSyncing,
    getEntryKind,
    removeFromCart,
  } = useBuilderInventory();

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
        Sincronizado con tu lista de compras en Shops.{" "}
        {equippableCount > 0
          ? `${equippableCount} objeto(s) equipable(s) en el selector del muñeco.`
          : "Añade armas o armaduras para equiparlas en el builder."}
      </p>

      {isSyncing && cartItems.length > 0 && (
        <p className="text-[10px] text-muted-foreground mb-2">Actualizando…</p>
      )}

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <ShoppingBag className="h-8 w-8 opacity-30" />
          <p className="text-xs text-center px-2">
            Vacío — añade objetos en Shops
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
          {cartItems.map((entry) => {
            const kind = getEntryKind(entry);
            const KindIcon = KIND_ICON[kind];

            return (
              <li
                key={entry.name}
                className={cn(
                  "rounded-md border border-border bg-muted/20 px-2.5 py-2 group",
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground leading-tight truncate">
                      {entry.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0 rounded border",
                          KIND_STYLE[kind],
                        )}
                      >
                        <KindIcon className="h-2.5 w-2.5 shrink-0" />
                        {KIND_LABEL[kind]}
                      </span>
                      {entry.cost && entry.cost !== "—" && (
                        <span className="text-[10px] text-primary">
                          {entry.cost}
                        </span>
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
                  </div>
                  {/* <button
                    type="button"
                    onClick={() => removeFromCart(entry.name)}
                    className="shrink-0 text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Quitar de la lista"
                  >
                    Quitar
                  </button> */}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
