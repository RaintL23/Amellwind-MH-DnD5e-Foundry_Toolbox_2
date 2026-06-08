import { Link } from "react-router-dom";
import { Package, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CartEntry } from "@/shared/types";
import { formatTotalGp, parseCostGp } from "@/features/shops/utils/cost.utils";
import { useBuilderInventory } from "../../context/BuilderInventoryContext";
import type { CartItemKind } from "../../utils/cart-equipment.resolver";

const KIND_LABELS: Record<CartItemKind, string> = {
  weapon: "Arma",
  armor: "Armadura",
  other: "Otro",
};

const KIND_ORDER: CartItemKind[] = ["weapon", "armor", "other"];

export function BuilderInventoryPanel() {
  const {
    items,
    totalItems,
    isSyncing,
    getEntryKind,
    removeFromInventory,
  } = useBuilderInventory();

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    entries: items.filter((entry) => getEntryKind(entry) === kind),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <Accordion type="single" collapsible>
        <AccordionItem value="inventory" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" aria-hidden />
              Inventario
              {totalItems > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
                  {totalItems}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
            {isSyncing ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Cargando inventario…
              </p>
            ) : items.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  El inventario está vacío.
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  Añade objetos desde{" "}
                  <Link
                    to="/shops"
                    className="font-medium text-primary hover:underline"
                  >
                    Tiendas
                  </Link>{" "}
                  o{" "}
                  <Link
                    to="/items"
                    className="font-medium text-primary hover:underline"
                  >
                    Objetos
                  </Link>{" "}
                  y pulsa Comprar.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {grouped.map(({ kind, entries }) => (
                  <div key={kind}>
                    <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {KIND_LABELS[kind]}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {entries.map((entry) => (
                        <InventoryRow
                          key={entry.name}
                          entry={entry}
                          kind={kind}
                          onRemove={removeFromInventory}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function InventoryRow({
  entry,
  kind,
  onRemove,
}: {
  entry: CartEntry;
  kind: CartItemKind;
  onRemove: (name: string) => void;
}) {
  const lineCost = parseCostGp(entry.cost) * entry.quantity;

  return (
    <li className="flex items-start justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {entry.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          {entry.quantity > 1 && (
            <span className="font-medium text-foreground">
              ×{entry.quantity}
            </span>
          )}
          {entry.cost !== "—" && (
            <span className="text-primary">
              {entry.quantity > 1 && parseCostGp(entry.cost) > 0
                ? formatTotalGp(lineCost)
                : entry.cost}
            </span>
          )}
          {entry.weight && entry.weight !== "—" && (
            <span>{entry.weight}</span>
          )}
          {kind === "other" && entry.shopName && (
            <span className="italic opacity-70">{entry.shopName}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(entry.name)}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Quitar ${entry.name} del inventario`}
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}
