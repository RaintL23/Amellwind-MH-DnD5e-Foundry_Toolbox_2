import { X } from "lucide-react";
import { parseEntries } from "@/shared/utils/fivetools-parser";
import { formatGpFromCp } from "@/shared/utils/currency.utils";
import { Badge } from "@/components/ui/badge";
import { RarityBadge } from "@/features/shops/components/RarityBadge";
import { DndRichText } from "@/shared/components/DndRichText";
import { ItemRefText } from "@/shared/components/ItemRefText";
import type { RaintdmItem } from "../types/item-forge.types";

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ItemForgeDetailPanel({
  item,
  onClose,
  itemDescMap,
}: {
  item: RaintdmItem;
  onClose: () => void;
  itemDescMap: Record<string, string>;
}) {
  const textEntries = item.entries
    .filter((entry) => typeof entry === "string")
    .map((entry) => parseEntries([entry]))
    .filter(Boolean);

  const meta = item.raintdm;
  const crafting = item.crafting;

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
          {meta?.damageType && (
            <Badge variant="outline" className="text-xs">
              {titleCase(meta.damageType)}
            </Badge>
          )}
          {meta?.chargesPerMagazine != null && (
            <Badge variant="outline" className="text-xs">
              {meta.chargesPerMagazine} Charges
            </Badge>
          )}
          {meta?.baseWeapon && (
            <Badge variant="outline" className="text-xs">
              {meta.baseWeapon}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Cost</p>
            <p className="text-sm font-semibold text-primary">
              {formatGpFromCp(item.valueCp)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Weight</p>
            <p className="text-sm font-semibold text-foreground">
              {item.weight !== null ? `${item.weight} lb.` : "—"}
            </p>
          </div>
        </div>

        {crafting && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Crafting
              </p>
              <Badge variant="outline" className="text-xs">
                {crafting.tool}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Ingredient 1
                </p>
                <ItemRefText text={crafting.item1} itemDescMap={itemDescMap} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Ingredient 2
                </p>
                <ItemRefText text={crafting.item2} itemDescMap={itemDescMap} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">DC</p>
                <Badge variant="default" className="font-mono text-xs">
                  {crafting.dc}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Qty</p>
                <p className="font-mono text-sm font-semibold">
                  {crafting.quantity ?? "1"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Same Combo List rules: 1d20 + ability modifier + proficiency bonus
              if proficient with the tool.
            </p>
          </div>
        )}

        {textEntries.length > 0 && (
          <div className="space-y-2">
            {textEntries.map((text, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                <DndRichText text={text} />
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
