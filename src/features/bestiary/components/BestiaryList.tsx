import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";
import {
  getAllBestiaryCreatures,
  getBestiarySourceCatalog,
  getListBestiaryCreatures,
  preloadBestiarySources,
} from "../services/bestiary.service";
import { CR_FILTER_OPTIONS, SIZE_FILTER_OPTIONS } from "./bestiary-columns";
import { BestiaryDataTable } from "./BestiaryDataTable";

const CR_OPTIONS = CR_FILTER_OPTIONS.filter((o) => o.value !== "");
const SIZE_OPTIONS = SIZE_FILTER_OPTIONS.filter((o) => o.value !== "");

export function BestiaryList() {
  const navigate = useNavigate();
  const [creatures, setCreatures] = useState<BestiaryCreature[]>([]);
  const [listCreatures, setListCreatures] = useState<BestiaryCreature[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

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

  const refreshCreatures = useCallback(async () => {
    const [all, list, sourceCatalog] = await Promise.all([
      getAllBestiaryCreatures(),
      getListBestiaryCreatures(),
      getBestiarySourceCatalog(),
    ]);
    setCreatures(all);
    setListCreatures(list);
    setFilterSourceCodes(sourceCatalog.available);
    setLoadedSources(sourceCatalog.loaded);
  }, []);

  useEffect(() => {
    refreshCreatures().finally(() => setLoading(false));
  }, [refreshCreatures]);

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
    void preloadBestiarySources(missing).then(() => {
      void refreshCreatures();
    });
  }, [sourceFilter, loadedSources, refreshCreatures]);

  const commitSearch = useCallback(
    (q: string) => patchFilters({ q }),
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

  const filtered = useMemo(() => {
    let result = listCreatures;

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          (c.searchText?.includes(q) ?? false) ||
          c.name.toLowerCase().includes(q) ||
          c.cr.toLowerCase().includes(q) ||
          c.size.toLowerCase().includes(q) ||
          c.type.type.toLowerCase().includes(q) ||
          (c.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (crs.length > 0) {
      result = result.filter((c) => crs.includes(c.cr));
    }
    if (sizes.length > 0) {
      result = result.filter((c) => sizes.includes(c.size));
    }
    if (types.length > 0) {
      result = result.filter((c) => types.includes(c.type.type));
    }
    if (environments.length > 0) {
      result = result.filter((c) =>
        (c.environment ?? []).some((e) => environments.includes(e)),
      );
    }
    if (sourceFilter.length > 0) {
      result = result.filter((c) =>
        entityMatchesSourceFilter(c, sourceFilter, catalog, bookNames),
      );
    }

    return result;
  }, [
    listCreatures,
    appliedSearch,
    crs,
    sizes,
    types,
    environments,
    sourceFilter,
    catalog,
    bookNames,
  ]);

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Swords className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Bestiary (D&amp;D 5e)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {listCreatures.length}
              {listCreatures.length < creatures.length && (
                <span className="opacity-70"> ({creatures.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          One row per creature name; open to compare sources and view stat blocks.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
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
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading />
        ) : listCreatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Swords className="h-10 w-10 opacity-20" />
            <p className="text-sm">No creatures loaded.</p>
          </div>
        ) : (
          <BestiaryDataTable creatures={filtered} onRowClick={handleSelect} />
        )}
      </div>
    </div>
  );
}
