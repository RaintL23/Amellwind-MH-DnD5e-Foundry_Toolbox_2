import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Class } from "@/shared/types";
import { useClassList } from "../hooks/useClassList";
import {
  ensureClassUaSourcesLoaded,
  getClassesByName,
} from "../services/class.service";
import { ClassDataTable } from "./ClassDataTable";
import { ClassListHeader } from "./ClassListHeader";
import { ClassListLoading } from "./ClassListLoading";
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
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
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
        id: "caster",
        title: "Spellcasting",
        mode: "multi" as const,
        options: CASTER_FILTER_OPTIONS,
      },
      sourceSection,
    ],
    [sourceSection],
  );

  const filtered = useMemo(() => {
    let result = listClasses;

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
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

    if (casters.length > 0) {
      result = result.filter((cls) => {
        const progression = cls.casterProgression ?? "none";
        return casters.includes(progression);
      });
    }

    if (sourceFilter.length > 0) {
      result = result.filter((cls) =>
        entityMatchesSourceFilter(cls, sourceFilter, catalog, bookNames),
      );
    }

    return result;
  }, [listClasses, appliedSearch, casters, sourceFilter, catalog, bookNames]);

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <ClassListHeader
        loading={loading}
        filteredCount={filtered.length}
        listCount={listClasses.length}
        totalCount={classes.length}
      />

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
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
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ClassListLoading />
        ) : listClasses.length === 0 ? (
          <ClassListEmpty />
        ) : (
          <ClassDataTable classes={filtered} onRowClick={handleSelect} />
        )}
      </div>
    </div>
  );
}
