import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useDeferredValue, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import {
  ListSearchWithFilters,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import {
  buildSourcesFilterSection,
  createSourceFilterMatcher,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";
import { cn } from "@/shared/utils/cn";
import { useBestiaryCatalog } from "../hooks/useBestiaryCatalog";
import { filterBestiaryCreatures } from "../utils/bestiary-filter.utils";
import { CR_FILTER_OPTIONS, SIZE_FILTER_OPTIONS } from "./bestiary-columns";
import { BestiaryDataTable } from "./BestiaryDataTable";

const CR_OPTIONS = CR_FILTER_OPTIONS.filter((o) => o.value !== "");
const SIZE_OPTIONS = SIZE_FILTER_OPTIONS.filter((o) => o.value !== "");

export function BestiaryList() {
  const navigate = useNavigate();
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();
  const {
    creatures,
    listCreatures,
    filterSourceCodes,
    loading,
    progress,
    preloadMissingSources,
  } = useBestiaryCatalog();

  const { q, getAll, patchFilters, ensureMultiIfEmpty } = useListSessionFilters({
    listId: "bestiary",
    stringKeys: ["q"],
    multiKeys: ["cr", "sz", "type", "env", "src"],
  });
  const crs = getAll("cr");
  const sizes = getAll("sz");
  const types = getAll("type");
  const environments = getAll("env");
  const sourceFilter = getAll("src");

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
    preloadMissingSources(sourceFilter);
  }, [sourceFilter, preloadMissingSources]);

  const commitSearch = useCallback(
    (next: string) => patchFilters({ q: next }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);

  const typeOptions = useMemo(() => {
    const typeSet = new Set<string>();
    for (const c of listCreatures) typeSet.add(c.type.type);
    return Array.from(typeSet)
      .sort((a, b) => a.localeCompare(b))
      .map((t) => ({ value: t, label: t }));
  }, [listCreatures]);

  const environmentOptions = useMemo(() => {
    const envs = new Set<string>();
    for (const c of listCreatures) {
      for (const e of c.environment ?? []) envs.add(e);
    }
    return Array.from(envs)
      .sort((a, b) => a.localeCompare(b))
      .map((e) => ({ value: e, label: e }));
  }, [listCreatures]);

  const sourceSection = useMemo(
    () => buildSourcesFilterSection(filterSourceCodes, catalog, bookNames),
    [filterSourceCodes, catalog, bookNames],
  );

  const filterSections = useMemo(
    () => [
      {
        id: "cr",
        title: "Challenge Rating",
        mode: "multi" as const,
        options: CR_OPTIONS,
      },
      {
        id: "sz",
        title: "Size",
        mode: "multi" as const,
        options: SIZE_OPTIONS,
      },
      {
        id: "type",
        title: "Type",
        mode: "multi" as const,
        options: typeOptions,
      },
      {
        id: "env",
        title: "Environment",
        mode: "multi" as const,
        options: environmentOptions,
      },
      sourceSection,
    ],
    [typeOptions, environmentOptions, sourceSection],
  );

  const sourceMatcher = useMemo(() => {
    if (sourceFilter.length === 0) return null;
    return createSourceFilterMatcher(sourceFilter, catalog, bookNames);
  }, [sourceFilter, catalog, bookNames]);

  const filterInput = useMemo(
    () => ({
      search: appliedSearch,
      crs,
      sizes,
      types,
      environments,
      sourceMatcher,
    }),
    [appliedSearch, crs, sizes, types, environments, sourceMatcher],
  );
  const deferredFilterInput = useDeferredValue(filterInput);
  const deferredList = useDeferredValue(listCreatures);
  const isFilterDeferred =
    deferredFilterInput !== filterInput || deferredList !== listCreatures;

  const filtered = useMemo(
    () =>
      filterBestiaryCreatures(
        deferredList,
        {
          search: deferredFilterInput.search,
          crs: deferredFilterInput.crs,
          sizes: deferredFilterInput.sizes,
          types: deferredFilterInput.types,
          environments: deferredFilterInput.environments,
        },
        deferredFilterInput.sourceMatcher,
      ),
    [deferredList, deferredFilterInput],
  );

  const filterResetKey = useMemo(
    () =>
      JSON.stringify({
        q: appliedSearch,
        crs,
        sizes,
        types,
        environments,
        src: sourceFilter,
      }),
    [appliedSearch, crs, sizes, types, environments, sourceFilter],
  );

  const handleSelect = useCallback(
    (row: BestiaryCreature) => {
      navigate(`/bestiary/${encodeURIComponent(row.id)}`);
    },
    [navigate],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      cr: Array.isArray(values.cr) ? values.cr : [],
      sz: Array.isArray(values.sz) ? values.sz : [],
      type: Array.isArray(values.type) ? values.type : [],
      env: Array.isArray(values.env) ? values.env : [],
      src: Array.isArray(values.src) ? values.src : [],
    });
  }

  const showUpdating = isSearchPending || isFilterDeferred;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-5">
        <div className="flex items-center gap-3 mb-1">
          <Swords className="h-6 w-6 text-amber-400 shrink-0" />
          <h1 className="text-xl font-bold text-foreground">Bestiary (D&amp;D 5e)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {listCreatures.length}
              {listCreatures.length < creatures.length && (
                <span className="opacity-70"> ({creatures.length} entries)</span>
              )}
            </span>
          )}
          {progress && (
            <span className="rounded-full border border-amber-800/40 bg-amber-950/30 px-2.5 py-0.5 text-xs text-amber-400">
              Loading sources {progress.loaded}/{progress.total}
            </span>
          )}
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          One row per creature name; open to compare sources and view stat blocks.
        </p>
      </div>

      <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm md:px-6">
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search name, type, CR..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            cr: crs,
            sz: sizes,
            type: types,
            env: environments,
            src: sourceFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Bestiary Filters"
          dialogDescription="Filter by CR, size, type, environment, and sourcebook. Changes apply when you save."
        />
        {showUpdating && !loading && (
          <p className="mt-2 text-[11px] text-muted-foreground" aria-live="polite">
            Updating…
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {loading ? (
          <ListAreaLoading />
        ) : listCreatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Swords className="h-10 w-10 opacity-20" />
            <p className="text-sm">No creatures loaded.</p>
          </div>
        ) : (
          <div
            className={cn(
              "transition-opacity duration-150",
              showUpdating && "opacity-60",
            )}
          >
            <BestiaryDataTable
              creatures={filtered}
              onRowClick={handleSelect}
              filterResetKey={filterResetKey}
            />
          </div>
        )}
      </div>
    </div>
  );
}
