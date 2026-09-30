import { useCallback, useDeferredValue, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Class } from "@/shared/types";
import { useClassList } from "../hooks/useClassList";
import {
  ensureClassUaSourcesLoaded,
  getClassesByName,
} from "../services/class.service";
import { ClassDataTable } from "./ClassDataTable";
import { ClassListHeader } from "./ClassListHeader";
import { ClassListEmpty } from "./ClassListEmpty";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
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
import { CASTER_OPTIONS } from "./table/class-table.constants";
import { getCasterLabel } from "../mappers/class.mapper";

const CASTER_FILTER_OPTIONS = CASTER_OPTIONS.filter((o) => o.value !== "").map(
  (o) => ({ value: o.value, label: o.label }),
);

export function ClassList() {
  const navigate = useNavigate();
  const { classes, listClasses, filterSourceCodes, loading, refresh } =
    useClassList();
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const { q, getAll, patchFilters, ensureMultiIfEmpty } = useListSessionFilters({
    listId: "classes",
    multiKeys: ["caster", "src"],
  });
  const casters = getAll("caster");
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
    void ensureClassUaSourcesLoaded(sourceFilter).then((changed) => {
      if (changed) void refresh();
    });
  }, [sourceFilter, refresh]);

  const commitSearch = useCallback(
    (next: string) => patchFilters({ q: next }),
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
        id: "caster",
        title: "Spellcasting",
        mode: "multi" as const,
        options: CASTER_FILTER_OPTIONS,
      },
      sourceSection,
    ],
    [sourceSection],
  );

  const sourceMatcher = useMemo(() => {
    if (sourceFilter.length === 0) return null;
    return createSourceFilterMatcher(sourceFilter, catalog, bookNames);
  }, [sourceFilter, catalog, bookNames]);

  const filterInput = useMemo(
    () => ({ appliedSearch, casters, sourceMatcher }),
    [appliedSearch, casters, sourceMatcher],
  );
  const deferredInput = useDeferredValue(filterInput);
  const deferredList = useDeferredValue(listClasses);
  const isFilterDeferred =
    deferredInput !== filterInput || deferredList !== listClasses;

  const filtered = useMemo(() => {
    let result = deferredList;
    const { appliedSearch: search, casters: casterVals, sourceMatcher: matcher } =
      deferredInput;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (cls) =>
          (cls.searchText?.includes(q) ?? false) ||
          cls.name.toLowerCase().includes(q) ||
          cls.summary.toLowerCase().includes(q) ||
          cls.hitDie.toLowerCase().includes(q) ||
          getCasterLabel(cls.casterProgression).toLowerCase().includes(q) ||
          cls.subclasses.some((s) => s.name.toLowerCase().includes(q)) ||
          (cls.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (casterVals.length > 0) {
      const casterSet = new Set(casterVals);
      result = result.filter((cls) => {
        const progression = cls.casterProgression ?? "none";
        return casterSet.has(progression);
      });
    }

    if (matcher) {
      result = result.filter((cls) => matcher(cls));
    }

    return result;
  }, [deferredList, deferredInput]);

  const handleSelect = useCallback(
    async (row: Class) => {
      const variants = await getClassesByName(row.name);
      const variant =
        variants.find((v) => v.source === row.source) ?? variants[0] ?? row;
      navigate(`/classes/${encodeURIComponent(variant.id)}`);
    },
    [navigate],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      caster: Array.isArray(values.caster) ? values.caster : [],
      src: Array.isArray(values.src) ? values.src : [],
    });
  }

  const showUpdating = isSearchPending || isFilterDeferred;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ClassListHeader
        loading={loading}
        filteredCount={filtered.length}
        listCount={listClasses.length}
        totalCount={classes.length}
      />

      <StickyListSearchBar updating={showUpdating && !loading}>
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search name, subclass, source..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            caster: casters,
            src: sourceFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Class Filters"
          dialogDescription="Filter by spellcasting progression and sourcebook. Changes apply when you save."
        />
      </StickyListSearchBar>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <DeferredListResults
          loading={loading}
          updating={showUpdating}
          isEmpty={listClasses.length === 0}
          empty={<ClassListEmpty />}
        >
          <ClassDataTable classes={filtered} onRowClick={handleSelect} />
        </DeferredListResults>
      </div>
    </div>
  );
}
