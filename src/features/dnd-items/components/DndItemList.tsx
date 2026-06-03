import { useEffect, useMemo, useState } from "react";
import { DndItem } from "@/shared/types";
import { Package } from "lucide-react";
import { getAllDndItems } from "../services/dnd-item.service";
import { getBookSourceNames } from "@/features/spells/services/book-source.service";
import {
  dedupeDndItemsByName,
  getDndItemsByName,
} from "../utils/item-dedupe.utils";
import { DndItemDataTable } from "./DndItemDataTable";
import { DndItemDetailDialog } from "./DndItemDetailDialog";

const RARITY_ORDER = [
  "none",
  "common",
  "uncommon",
  "rare",
  "very rare",
  "legendary",
  "artifact",
  "varies",
  "unknown",
];

export function DndItemList() {
  const [items, setItems] = useState<DndItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DndItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    void getBookSourceNames();
    getAllDndItems()
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load items");
      })
      .finally(() => setLoading(false));
  }, []);

  const listItems = useMemo(() => dedupeDndItemsByName(items), [items]);

  const sourceOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.source))).sort(),
    [items],
  );

  const rarityOptions = useMemo(() => {
    const present = new Set(listItems.map((i) => i.rarity));
    return RARITY_ORDER.filter((r) => present.has(r));
  }, [listItems]);

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const item of listItems) {
      if (item.typeLabel && item.typeLabel !== "—") types.add(item.typeLabel);
    }
    return Array.from(types).sort();
  }, [listItems]);

  const generatedVariantCount = useMemo(
    () => items.filter((i) => i.isSpecificVariant).length,
    [items],
  );

  const selectedVariants = useMemo(() => {
    if (!selected) return [];
    return getDndItemsByName(items, selected.name);
  }, [selected, items]);

  function handleSelect(item: DndItem) {
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Package className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Items (D&amp;D 5e)</h1>
          {!loading && !error && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {listItems.length.toLocaleString()} items
              {listItems.length < items.length && (
                <span className="opacity-70">
                  {" "}
                  ({items.length.toLocaleString()} entries)
                </span>
              )}
              {generatedVariantCount > 0 && (
                <span className="opacity-70">
                  {" "}
                  · {generatedVariantCount.toLocaleString()} generated variants
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          One row per item name; open an item to compare sources (PHB, DMG, XPHB,
          etc.).
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm">Loading items...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Package className="h-10 w-10 opacity-20" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : listItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Package className="h-10 w-10 opacity-20" />
            <p className="text-sm">No items loaded.</p>
          </div>
        ) : (
          <DndItemDataTable
            items={listItems}
            sourceOptions={sourceOptions}
            rarityOptions={rarityOptions}
            typeOptions={typeOptions}
            onRowClick={handleSelect}
          />
        )}
      </div>

      <DndItemDetailDialog
        item={selected}
        variants={selectedVariants}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
