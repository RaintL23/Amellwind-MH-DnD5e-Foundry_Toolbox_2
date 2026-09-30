import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { DndItem } from "@/shared/types";
import { Package } from "lucide-react";
import {
  getAllDndItems,
  getDndItemsByName,
  getDndItemSourceCatalog,
  getListDndItems,
  preloadDndItemSources,
} from "../services/dnd-item.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import {
  ListSearchWithFilters,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import {
  DeferredListResults,
  StickyListSearchBar,
} from "@/shared/components/DeferredListResults";
import {
  buildSourcesFilterSection,
  createSourceFilterMatcher,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";
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

const MUNDANE_MAGIC_OPTIONS = [
  { value: "mundane", label: "Mundane" },
  { value: "magic", label: "Magic" },
];

const ATTUNEMENT_OPTIONS = [
  { value: "yes", label: "Requires attunement" },
  { value: "no", label: "No attunement" },
];

function rarityLabel(rarity: string): string {
  if (!rarity) return rarity;
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export function DndItemList() {
  const [items, setItems] = useState<DndItem[]>([]);
  const [listItems, setListItems] = useState<DndItem[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DndItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<DndItem[]>([]);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const { q, getString, getAll, patchFilters, ensureMultiIfEmpty } =
    useListSessionFilters({
      listId: "dnd-items",
      stringKeys: ["q", "magic", "attune"],
      multiKeys: ["rarity", "type", "src"],
      urlPreserveKeys: ["item"],
    });
  const { value: itemParam, setValue: setItemParam } = useListItemUrlParam("item");
  const mundaneMagic = getString("magic");
  const rarities = getAll("rarity");
  const types = getAll("type");
  const attunement = getString("attune");
  const sourceFilter = getAll("src");

  const refreshItems = useCallback(async () => {
    const [all, list, sourceCatalog] = await Promise.all([
      getAllDndItems(),
      getListDndItems(),
      getDndItemSourceCatalog(),
    ]);
    setItems(all);
    setListItems(list);
    setFilterSourceCodes(sourceCatalog.available);
    setLoadedSources(sourceCatalog.loaded);
  }, []);

  useEffect(() => {
    refreshItems()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load items");
      })
      .finally(() => setLoading(false));
  }, [refreshItems]);

  useEffect(() => {
    if (sourceFilter.length > 0 || catalog.size === 0 || filterSourceCodes.length === 0) {
      return;
    }
    const defaults = defaultOfficialSourceCodes(filterSourceCodes, catalog);
    if (defaults.length === 0) return;
    ensureMultiIfEmpty("src", defaults);
  }, [catalog, filterSourceCodes, sourceFilter.length, ensureMultiIfEmpty]);

  useEffect(() => {
    if (sourceFilter.length === 0) return;
    const missing = sourceFilter.filter((s) => !loadedSources.includes(s));
    if (missing.length === 0) return;
    void preloadDndItemSources(missing).then(() => {
      void refreshItems();
    });
  }, [sourceFilter, loadedSources, refreshItems]);

  const commitSearch = useCallback(
    (q: string) => patchFilters({ q }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);

  const rarityOptions = useMemo(() => {
    const present = new Set(listItems.map((i) => i.rarity));
    return RARITY_ORDER.filter((r) => present.has(r)).map((r) => ({
      value: r,
      label: rarityLabel(r),
    }));
  }, [listItems]);

  const typeOptions = useMemo(() => {
    const typeSet = new Set<string>();
    for (const item of listItems) {
      if (item.typeLabel && item.typeLabel !== "—") typeSet.add(item.typeLabel);
    }
    return Array.from(typeSet)
      .sort()
      .map((t) => ({ value: t, label: t }));
  }, [listItems]);

  const sourceSection = useMemo(
    () => buildSourcesFilterSection(filterSourceCodes, catalog, bookNames),
    [filterSourceCodes, catalog, bookNames],
  );

  const filterSections = useMemo(
    () => [
      {
        id: "magic",
        title: "Mundane / Magic",
        mode: "single" as const,
        options: MUNDANE_MAGIC_OPTIONS,
      },
      {
        id: "rarity",
        title: "Rarity",
        mode: "multi" as const,
        options: rarityOptions,
      },
      {
        id: "type",
        title: "Type",
        mode: "multi" as const,
        options: typeOptions,
      },
      {
        id: "attune",
        title: "Attunement",
        mode: "single" as const,
        options: ATTUNEMENT_OPTIONS,
      },
      sourceSection,
    ],
    [rarityOptions, typeOptions, sourceSection],
  );

  const filterInput = useMemo(
    () => ({
      appliedSearch,
      mundaneMagic,
      rarities,
      types,
      attunement,
      sourceMatcher:
        sourceFilter.length > 0
          ? createSourceFilterMatcher(sourceFilter, catalog, bookNames)
          : null,
    }),
    [
      appliedSearch,
      mundaneMagic,
      rarities,
      types,
      attunement,
      sourceFilter,
      catalog,
      bookNames,
    ],
  );
  const deferredInput = useDeferredValue(filterInput);
  const deferredList = useDeferredValue(listItems);
  const isFilterDeferred =
    deferredInput !== filterInput || deferredList !== listItems;

  const filtered = useMemo(() => {
    let result = deferredList;
    const {
      appliedSearch: search,
      mundaneMagic: magic,
      rarities: rarityVals,
      types: typeVals,
      attunement: attune,
      sourceMatcher: matcher,
    } = deferredInput;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.searchText.includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.typeLabel.toLowerCase().includes(q) ||
          item.rarityLabel.toLowerCase().includes(q) ||
          (item.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (magic === "mundane") {
      result = result.filter((i) => i.isMundane);
    } else if (magic === "magic") {
      result = result.filter((i) => i.isMagic);
    }

    if (rarityVals.length > 0) {
      const raritySet = new Set(rarityVals);
      result = result.filter((i) => raritySet.has(i.rarity));
    }

    if (typeVals.length > 0) {
      const typeSet = new Set(typeVals);
      result = result.filter((i) => typeSet.has(i.typeLabel));
    }

    if (attune === "yes") {
      result = result.filter((i) => i.attunement != null);
    } else if (attune === "no") {
      result = result.filter((i) => i.attunement == null);
    }

    if (matcher) {
      result = result.filter((i) => matcher(i));
    }

    return result;
  }, [deferredList, deferredInput]);

  const generatedVariantCount = useMemo(
    () => items.filter((i) => i.isSpecificVariant).length,
    [items],
  );

  const openItem = useCallback(
    (item: DndItem) => {
      setSelected(item);
      setDialogOpen(true);
      setItemParam(item.name);
      void getDndItemsByName(item.name).then(setSelectedVariants);
    },
    [setItemParam],
  );

  useEffect(() => {
    if (!itemParam) {
      setDialogOpen(false);
      setSelected(null);
      setSelectedVariants([]);
      return;
    }
    if (loading) return;

    const decoded = decodeURIComponent(itemParam);
    const found =
      listItems.find((item) => item.name.toLowerCase() === decoded.toLowerCase()) ??
      items.find((item) => item.name.toLowerCase() === decoded.toLowerCase());
    if (!found || (selected?.name === found.name && dialogOpen)) return;

    setSelected(found);
    setDialogOpen(true);
    void getDndItemsByName(found.name).then(setSelectedVariants);
  }, [itemParam, loading, listItems, items, selected?.name, dialogOpen]);

  const handleSelect = useCallback(
    (item: DndItem) => openItem(item),
    [openItem],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(null);
        setSelectedVariants([]);
        setItemParam(null);
      }
    },
    [setItemParam],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      magic: typeof values.magic === "string" ? values.magic : "",
      rarity: Array.isArray(values.rarity) ? values.rarity : [],
      type: Array.isArray(values.type) ? values.type : [],
      attune: typeof values.attune === "string" ? values.attune : "",
      src: Array.isArray(values.src) ? values.src : [],
    });
  }

  const showUpdating = isSearchPending || isFilterDeferred;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-5">
        <div className="mb-1 flex items-center gap-3">
          <Package className="h-6 w-6 shrink-0 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Items (D&amp;D 5e)</h1>
          {!loading && !error && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length.toLocaleString()} / {listItems.length.toLocaleString()}
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
        <p className="hidden text-sm text-muted-foreground sm:block">
          One row per item name; open an item to compare sources (PHB, DMG, XPHB,
          etc.).
        </p>
      </div>

      <StickyListSearchBar updating={showUpdating && !loading}>
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search name, type, description..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            magic: mundaneMagic,
            rarity: rarities,
            type: types,
            attune: attunement,
            src: sourceFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Item Filters"
          dialogDescription="Filter by mundane/magic, rarity, type, attunement, and sourcebook. Changes apply when you save."
        />
      </StickyListSearchBar>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {error ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Package className="h-10 w-10 opacity-20" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <DeferredListResults
            loading={loading}
            updating={showUpdating}
            isEmpty={listItems.length === 0}
            empty={
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Package className="h-10 w-10 opacity-20" />
                <p className="text-sm">No items loaded.</p>
              </div>
            }
          >
            <DndItemDataTable items={filtered} onRowClick={handleSelect} />
          </DeferredListResults>
        )}
      </div>

      {dialogOpen && selected && (
        <DndItemDetailDialog
          key={selected.id}
          item={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </div>
  );
}
