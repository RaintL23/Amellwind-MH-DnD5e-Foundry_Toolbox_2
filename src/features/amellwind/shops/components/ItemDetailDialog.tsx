import { Check, ShoppingCart } from "lucide-react";
import { MHItem } from "@/shared/types";
import { parseEntries } from "@/shared/utils/fivetools-parser";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatValueGp } from "../services/item.service";
import { useCart } from "../context/CartContext";
import { RarityBadge } from "./RarityBadge";
import { DndRichText } from "@/shared/components/DndRichText";

export function ItemDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MHItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addItem, items: cartItems } = useCart();
  if (!item) return null;

  const inCart = cartItems.some((c) => c.name === item.name);
  const textEntries = item.entries
    .filter((entry) => typeof entry === "string")
    .map((entry) => parseEntries([entry]))
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-xl pr-6">
            {item.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {item.typeLabel}
              </Badge>
              <RarityBadge rarity={item.rarity} />
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
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
                <p
                  key={i}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
