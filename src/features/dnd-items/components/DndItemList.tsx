import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DndItem } from "@/shared/types";
import { Package } from "lucide-react";
import {
  getAllDndItems,
  getDndItemsByName,
  getDndItemSourceCatalog,
  getListDndItems,
  loadSourceOnDemand,
} from "../services/dnd-item.service";
import {
  buildSourceOptions,
  collectEntitySources,
} from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useDataTableUrlState } from "@/shared/hooks/useDataTableUrlState";
import { DND_ITEM_COLUMN_URL_MAP } from "./dnd-item-list-url.constants";
import { cn } from "@/shared/utils/cn";
import { DndItemDataTable } from "./DndItemDataTable";
import { DndItemDetailDialog } from "./DndItemDetailDialog";

const UNLOADED_SOURCES_PREVIEW_LIMIT = 40;

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
  const [listItems, setListItems] = useState<DndItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSource, setLoadingSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [selected, setSelected] = useState<DndItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<DndItem[]>([]);
  const [showAllUnloadedSources, setShowAllUnloadedSources] = useState(false);
  const bookNames = useBookSourceNames();
  const { initialSearch, initialColumnFilters, handleFilterStateChange } =
    useDataTableUrlState(DND_ITEM_COLUMN_URL_MAP);

  const refreshItems = useCallback(async () => {
    const [all, list, catalog] = await Promise.all([
      getAllDndItems(),
      getListDndItems(),
      getDndItemSourceCatalog(),
    ]);
    setItems(all);
    setListItems(list);
    setAvailableSources(catalog.available);
    setLoadedSources(catalog.loaded);
  }, []);

  useEffect(() => {
    refreshItems()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load items");
      })
      .finally(() => setLoading(false));
  }, [refreshItems]);

  const unloadedSources = useMemo(
    () => availableSources.filter((s) => !loadedSources.includes(s)),
    [availableSources, loadedSources],
  );

  const unloadedSourceOptions = useMemo(
    () => buildSourceOptions(unloadedSources, bookNames),
    [unloadedSources, bookNames],
  );

  const hasMoreUnloadedSources =
    unloadedSourceOptions.length > UNLOADED_SOURCES_PREVIEW_LIMIT;

  const visibleUnloadedSourceOptions = useMemo(
    () =>
      showAllUnloadedSources || !hasMoreUnloadedSources
        ? unloadedSourceOptions
        : unloadedSourceOptions.slice(0, UNLOADED_SOURCES_PREVIEW_LIMIT),
    [unloadedSourceOptions, showAllUnloadedSources, hasMoreUnloadedSources],
  );

  useEffect(() => {
    if (!hasMoreUnloadedSources) setShowAllUnloadedSources(false);
  }, [hasMoreUnloadedSources]);

  async function handleLoadSource(source: string) {
    setLoadingSource(source);
    try {
      await loadSourceOnDemand(source);
      await refreshItems();
    } finally {
      setLoadingSource(null);
    }
  }

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listItems), bookNames),
    [listItems, bookNames],
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

  const handleSelect = useCallback((item: DndItem) => {
    setSelected(item);
    setDialogOpen(true);
    void getDndItemsByName(item.name).then(setSelectedVariants);
  }, []);

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
          etc.). Load more books below.
        </p>
      </div>

      {!loading && !error && unloadedSources.length > 0 && (
        <div className="shrink-0 border-b border-border px-6 py-3">
          <p className="text-xs text-muted-foreground mb-2">
            Load additional sources ({loadedSources.length}/{availableSources.length}{" "}
            loaded):
          </p>
          <div
            className={cn(
              "flex flex-wrap gap-1.5 overflow-y-auto",
              showAllUnloadedSources ? "max-h-48" : "max-h-24",
            )}
          >
            {visibleUnloadedSourceOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                title={value}
                disabled={loadingSource === value}
                onClick={() => void handleLoadSource(value)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  loadingSource === value
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {loadingSource === value ? "…" : `+ ${label}`}
              </button>
            ))}
            {hasMoreUnloadedSources && (
              <button
                type="button"
                onClick={() => setShowAllUnloadedSources((v) => !v)}
                className="rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground self-center hover:bg-accent hover:text-foreground transition-colors"
              >
                {showAllUnloadedSources
                  ? "Show less"
                  : `+${unloadedSourceOptions.length - UNLOADED_SOURCES_PREVIEW_LIMIT} more`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <ListAreaLoading />
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
            initialSearch={initialSearch}
            initialColumnFilters={initialColumnFilters}
            onFilterStateChange={handleFilterStateChange}
          />
        )}
      </div>

      {dialogOpen && selected && (
        <DndItemDetailDialog
          key={selected.id}
          item={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
