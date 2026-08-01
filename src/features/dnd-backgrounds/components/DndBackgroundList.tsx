import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DndBackground } from "@/shared/types";
import { DND_BACKGROUND_EDITION_LABELS } from "@/shared/types";
import { ScrollText } from "lucide-react";
import {
  getAllDndBackgrounds,
  getDndBackgroundsByName,
  getListDndBackgrounds,
} from "../services/dnd-background.service";
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
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import {
  collectEntitySources,
  defaultOfficialSourceCodes,
} from "@/shared/services/source-catalog.service";
import { DndBackgroundDataTable } from "./DndBackgroundDataTable";
import { DndBackgroundDetailDialog } from "./DndBackgroundDetailDialog";

const EDITION_OPTIONS = (
  Object.entries(DND_BACKGROUND_EDITION_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));

export function DndBackgroundList() {
  const [backgrounds, setBackgrounds] = useState<DndBackground[]>([]);
  const [listBackgrounds, setListBackgrounds] = useState<DndBackground[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DndBackground | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<DndBackground[]>([]);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const { q, getAll, patchFilters, ensureMultiIfEmpty } =
    useListSessionFilters({
      listId: "dnd-backgrounds",
      multiKeys: ["ed", "src"],
      urlPreserveKeys: ["background"],
    });
  const { value: backgroundParam, setValue: setBackgroundParam } =
    useListItemUrlParam("background");
  const editions = getAll("ed");
  const sourceFilter = getAll("src");

  const refresh = useCallback(async () => {
    const [all, list] = await Promise.all([
      getAllDndBackgrounds(),
      getListDndBackgrounds(),
    ]);
    setBackgrounds(all);
    setListBackgrounds(list);
    setFilterSourceCodes(collectEntitySources(list));
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (sourceFilter.length > 0 || catalog.size === 0 || filterSourceCodes.length === 0) {
      return;
    }
    const defaults = defaultOfficialSourceCodes(filterSourceCodes, catalog);
    if (defaults.length === 0) return;
    ensureMultiIfEmpty("src", defaults);
  }, [catalog, filterSourceCodes, sourceFilter.length, ensureMultiIfEmpty]);

  const commitSearch = useCallback(
    (q: string) => patchFilters({ q }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);

  const sourceSection = useMemo(
    () => buildSourcesFilterSection(filterSourceCodes, catalog, bookNames),
    [filterSourceCodes, catalog, bookNames],
  );

  const filterSections = useMemo(
    () => [
      {
        id: "ed",
        title: "Edition",
        mode: "multi" as const,
        options: EDITION_OPTIONS,
      },
      sourceSection,
    ],
    [sourceSection],
  );

  const filtered = useMemo(() => {
    let result = listBackgrounds;

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter(
        (bg) =>
          (bg.searchText?.includes(q) ?? false) ||
          bg.name.toLowerCase().includes(q) ||
          (bg.abilitySummary?.toLowerCase().includes(q) ?? false) ||
          (bg.featSummary?.toLowerCase().includes(q) ?? false) ||
          (bg.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (editions.length > 0) {
      result = result.filter(
        (bg) => bg.edition != null && editions.includes(bg.edition),
      );
    }

    if (sourceFilter.length > 0) {
      result = result.filter((bg) =>
        entityMatchesSourceFilter(bg, sourceFilter, catalog, bookNames),
      );
    }

    return result;
  }, [listBackgrounds, appliedSearch, editions, sourceFilter, catalog, bookNames]);

  const openBackground = useCallback(
    (background: DndBackground) => {
      setSelected(background);
      setDialogOpen(true);
      setBackgroundParam(background.name);
      void getDndBackgroundsByName(background.name).then(setSelectedVariants);
    },
    [setBackgroundParam],
  );

  useEffect(() => {
    if (!backgroundParam) {
      setDialogOpen(false);
      setSelected(null);
      setSelectedVariants([]);
      return;
    }
    if (loading) return;

    const decoded = decodeURIComponent(backgroundParam);
    const found =
      listBackgrounds.find(
        (background) => background.name.toLowerCase() === decoded.toLowerCase(),
      ) ??
      backgrounds.find(
        (background) => background.name.toLowerCase() === decoded.toLowerCase(),
      );
    if (!found || (selected?.name === found.name && dialogOpen)) return;

    setSelected(found);
    setDialogOpen(true);
    void getDndBackgroundsByName(found.name).then(setSelectedVariants);
  }, [
    backgroundParam,
    loading,
    listBackgrounds,
    backgrounds,
    selected?.name,
    dialogOpen,
  ]);

  const handleSelect = useCallback(
    (background: DndBackground) => openBackground(background),
    [openBackground],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(null);
        setSelectedVariants([]);
        setBackgroundParam(null);
      }
    },
    [setBackgroundParam],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      ed: Array.isArray(values.ed) ? values.ed : [],
      src: Array.isArray(values.src) ? values.src : [],
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <ScrollText className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">
            Backgrounds (D&amp;D 5e)
          </h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {listBackgrounds.length}
              {listBackgrounds.length < backgrounds.length && (
                <span className="opacity-70">
                  {" "}
                  ({backgrounds.length} entries)
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Official character backgrounds from D&amp;D 5e sourcebooks.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search name, skills, tools..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            ed: editions,
            src: sourceFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Background Filters"
          dialogDescription="Filter by edition and sourcebook. Changes apply when you save."
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading />
        ) : listBackgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <ScrollText className="h-10 w-10 opacity-20" />
            <p className="text-sm">No backgrounds loaded.</p>
          </div>
        ) : (
          <DndBackgroundDataTable
            backgrounds={filtered}
            onRowClick={handleSelect}
          />
        )}
      </div>

      {dialogOpen && selected && (
        <DndBackgroundDetailDialog
          key={selected.id}
          background={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </div>
  );
}
