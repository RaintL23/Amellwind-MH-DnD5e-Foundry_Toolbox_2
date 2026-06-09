import { Link } from "react-router-dom";
import { Check, Package, Trash2, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArmorItem, CartEntry } from "@/shared/types";
import { formatTotalGp, parseCostGp } from "@/features/shops/utils/cost.utils";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useBuilderInventory } from "../../context/BuilderInventoryContext";
import {
  findArmorByCartName,
  type CartItemKind,
} from "../../utils/cart-equipment.resolver";

const KIND_LABELS: Record<CartItemKind, string> = {
  weapon: "Weapon",
  armor: "Armor",
  other: "Other",
};

const KIND_ORDER: CartItemKind[] = ["weapon", "armor", "other"];

export function BuilderInventoryPanel() {
  const {
    items,
    totalItems,
    isSyncing,
    getEntryKind,
    removeFromInventory,
    clearInventory,
  } = useBuilderInventory();
  const { armor, equipArmor } = useCharacterBuilder();
  const equippedArmorName = armor?.armor.name ?? null;

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
              Inventory
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
                Loading inventory…
              </p>
            ) : items.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  The inventory is empty. Add items from{" "}
                  <Link
                    to="/shops"
                    className="font-medium text-primary hover:underline"
                  >
                    Shops
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/items"
                    className="font-medium text-primary hover:underline"
                  >
                    Items
                  </Link>{" "}
                  and press <kbd className="text-[10px] font-medium">Buy</kbd>.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={clearInventory}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Clear inventory
                </button>
                {grouped.map(({ kind, entries }) => (
                  <div key={kind}>
                    <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {KIND_LABELS[kind]}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {entries.map((entry) => (
                        <InventoryRow
                          key={entry.startingEquipmentId ?? entry.name}
                          entry={entry}
                          kind={kind}
                          equippedArmorName={equippedArmorName}
                          onEquipArmor={equipArmor}
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
  equippedArmorName,
  onEquipArmor,
  onRemove,
}: {
  entry: CartEntry;
  kind: CartItemKind;
  equippedArmorName: string | null;
  onEquipArmor: (armor: ArmorItem) => void;
  onRemove: (name: string) => void;
}) {
  const lineCost = parseCostGp(entry.cost) * entry.quantity;
  const armorItem = kind === "armor" ? findArmorByCartName(entry.name) : null;
  const isEquipped = !!armorItem && equippedArmorName === armorItem.name;

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
          {entry.weight && entry.weight !== "—" && <span>{entry.weight}</span>}
          {kind === "other" && entry.shopName && (
            <span className="italic opacity-70">{entry.shopName}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {armorItem && (
          <button
            type="button"
            onClick={() => onEquipArmor(armorItem)}
            disabled={isEquipped}
            title={
              isEquipped
                ? `${armorItem.name} is already equipped`
                : `Equipar ${armorItem.name}`
            }
            className={cn(
              "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              isEquipped
                ? "cursor-default border-emerald-700/40 bg-emerald-950/30 text-emerald-300"
                : "border-sky-700/40 bg-sky-950/20 text-sky-200 hover:bg-sky-950/40",
            )}
          >
            {isEquipped ? (
              <>
                <Check className="h-3 w-3" aria-hidden />
                Equipped
              </>
            ) : (
              "Equip"
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(entry.name)}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remove ${entry.name} from inventory`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}
