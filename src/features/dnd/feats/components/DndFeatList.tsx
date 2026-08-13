import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { DndFeat } from "@/shared/types";
import {
  ensureDndFeatUaSourcesLoaded,
  getAllDndFeats,
  getDndFeatFilterSourceCodes,
  getDndFeatsByName,
  getListDndFeats,
} from "../services/dnd-feat.service";
import { useCompendiumListPage } from "@/shared/hooks/useCompendiumListPage";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { entityMatchesSourceFilter } from "@/shared/utils/compendium-source-filter.utils";
import {
  buildDndFeatFilterSections,
  collectDndFeatPresentFacets,
  DND_FEAT_LIST_MULTI_KEYS,
  dndFeatMatchesFacetFilters,
  type DndFeatListMultiKey,
} from "../utils/dnd-feat-list-filters";
import { DndFeatCard } from "./DndFeatCard";
import { DndFeatDetailDialog } from "./DndFeatDetailDialog";
import { Pagination } from "@/components/ui/pagination";
import { Award } from "lucide-react";

const DND_FEAT_PAGE_SIZE = 30;

export function DndFeatList() {
  const {
    all: feats,
    list: listFeats,
    loading,
    getString,
    getAll,
    patchFilters,
    sourceSection,
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    bookNames,
    catalog,
    dialog,
  } = useCompendiumListPage<DndFeat>({
    session: {
      listId: "dnd-feats",
      stringKeys: ["q", "repeat"],
      multiKeys: DND_FEAT_LIST_MULTI_KEYS,
      urlPreserveKeys: ["feat"],
    },
    load: async () => {
      const [all, list, codes] = await Promise.all([
        getAllDndFeats(),
        getListDndFeats(),
        getDndFeatFilterSourceCodes(),
      ]);
      return { all, list, filterSourceCodes: codes };
    },
    ensureSourcesLoaded: (sources) => ensureDndFeatUaSourcesLoaded(sources),
    urlDialog: {
      paramKey: "feat",
      getVariantsByName: getDndFeatsByName,
    },
  });

  const multi = useMemo(() => {
    const out = {} as Record<DndFeatListMultiKey, string[]>;
    for (const key of DND_FEAT_LIST_MULTI_KEYS) out[key] = getAll(key);
    return out;
  }, [getAll]);

  const repeat = getString("repeat");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DND_FEAT_PAGE_SIZE);

  const presentFacets = useMemo(
    () => collectDndFeatPresentFacets(listFeats),
    [listFeats],
  );

  const filterSections = useMemo(
    () => buildDndFeatFilterSections(presentFacets, sourceSection),
    [presentFacets, sourceSection],
  );

  const filterValues = useMemo(() => {
    const values: ListFilterValues = { repeat };
    for (const key of DND_FEAT_LIST_MULTI_KEYS) values[key] = multi[key];
    return values;
  }, [multi, repeat]);

  const filtered = useMemo(() => {
    let result = listFeats;

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.searchText ?? f.summary).toLowerCase().includes(q) ||
          f.prerequisites.some((p) => p.toLowerCase().includes(q)) ||
          f.abilityIncreases.some((a) => a.label.toLowerCase().includes(q)) ||
          (f.variantSources ?? [f.source]).some((s) =>
            s.toLowerCase().includes(q),
          ),
      );
    }

    result = result.filter((f) =>
      dndFeatMatchesFacetFilters(f, filterValues, {
        sourceMatcher: (feat, selected) =>
          entityMatchesSourceFilter(feat, selected, catalog, bookNames),
      }),
    );

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [listFeats, appliedSearch, filterValues, catalog, bookNames]);

  useEffect(() => {
    setPage(1);
  }, [
    appliedSearch,
    repeat,
    multi.kind,
    multi.cat,
    multi.abi,
    multi.prereq,
    multi.plvl,
    multi.src,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const handleSelect = useCallback(
    (feat: DndFeat) => dialog?.openItem(feat),
    [dialog],
  );

  function applyDialogFilters(values: ListFilterValues) {
    const patch: Record<string, string | string[]> = {
      repeat: typeof values.repeat === "string" ? values.repeat : "",
    };
    for (const key of DND_FEAT_LIST_MULTI_KEYS) {
      patch[key] = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    }
    patchFilters(patch);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Award className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Feats (D&amp;D 5e)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {listFeats.length}
              {listFeats.length < feats.length && (
                <span className="opacity-70"> ({feats.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Official feats from D&amp;D 5e sourcebooks, including Origin Feats from
          the 2024 rules.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search feat, prerequisite, ability..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={filterValues}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Feat Filters"
          dialogDescription="Filter by kind, category, ability increases, prerequisites, prerequisite level, and sourcebook. Changes apply when you save."
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading variant="cards" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Award className="h-10 w-10 opacity-20" />
            <p className="text-sm">No feats found with those filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((item) => (
              <DndFeatCard key={item.id} feat={item} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>

      {!loading && !isSearchPending && filtered.length > 0 && (
        <div className="shrink-0 border-t border-border px-6 py-3">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      {dialog?.dialogOpen && dialog.selected && (
        <DndFeatDetailDialog
          key={dialog.selected.id}
          feat={dialog.selected}
          variants={dialog.selectedVariants}
          open={dialog.dialogOpen}
          onOpenChange={dialog.handleDialogOpenChange}
        />
      )}
    </div>
  );
}
