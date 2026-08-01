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
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import {
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";
import { DndFeatCard } from "./DndFeatCard";
import { DndFeatDetailDialog } from "./DndFeatDetailDialog";
import { Pagination } from "@/components/ui/pagination";
import { Award } from "lucide-react";

type DndFeatFilter =
  | ""
  | "origin"
  | "repeatable"
  | "ability"
  | "prerequisite";

const FEAT_TYPE_OPTIONS = [
  { value: "origin", label: "Origin Feats" },
  { value: "repeatable", label: "Repeatable" },
  { value: "ability", label: "With ability increases" },
  { value: "prerequisite", label: "With prerequisites" },
];

const DND_FEAT_PAGE_SIZE = 30;

export function DndFeatList() {
  const [feats, setFeats] = useState<DndFeat[]>([]);
  const [listFeats, setListFeats] = useState<DndFeat[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { q, getString, getAll, patchFilters, ensureMultiIfEmpty } =
    useListSessionFilters({
      listId: "dnd-feats",
      stringKeys: ["q", "filter"],
      multiKeys: ["src"],
      urlPreserveKeys: ["feat"],
    });
  const { value: featParam, setValue: setFeatParam } = useListItemUrlParam("feat");
  const filter = getString("filter") as DndFeatFilter;
  const sourceFilter = getAll("src");
  const [selected, setSelected] = useState<DndFeat | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<DndFeat[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DND_FEAT_PAGE_SIZE);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const refresh = useCallback(async () => {
    const [all, list, codes] = await Promise.all([
      getAllDndFeats(),
      getListDndFeats(),
      getDndFeatFilterSourceCodes(),
    ]);
    setFeats(all);
    setListFeats(list);
    setFilterSourceCodes(codes);
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

  useEffect(() => {
    if (sourceFilter.length === 0) return;
    void ensureDndFeatUaSourcesLoaded(sourceFilter).then((changed) => {
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
        id: "filter",
        title: "Feat Type",
        mode: "single" as const,
        options: FEAT_TYPE_OPTIONS,
      },
      sourceSection,
    ],
    [sourceSection],
  );

  const filtered = useMemo(() => {
    let result = listFeats;

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.searchText ?? f.summary).toLowerCase().includes(q) ||
          (f.variantSources ?? [f.source]).some((s) =>
            s.toLowerCase().includes(q),
          ),
      );
    }

    if (sourceFilter.length > 0) {
      result = result.filter((f) =>
        entityMatchesSourceFilter(f, sourceFilter, catalog, bookNames),
      );
    }

    if (filter === "origin") {
      result = result.filter((f) => f.isOriginFeat);
    } else if (filter === "repeatable") {
      result = result.filter((f) => f.repeatable);
    } else if (filter === "ability") {
      result = result.filter((f) => f.abilityIncreases.length > 0);
    } else if (filter === "prerequisite") {
      result = result.filter((f) => f.prerequisites.length > 0);
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [listFeats, appliedSearch, filter, sourceFilter, catalog, bookNames]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, filter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const openFeat = useCallback(
    (feat: DndFeat) => {
      setSelected(feat);
      setDialogOpen(true);
      setFeatParam(feat.name);
      void getDndFeatsByName(feat.name).then(setSelectedVariants);
    },
    [setFeatParam],
  );

  useEffect(() => {
    if (!featParam) {
      setDialogOpen(false);
      setSelected(null);
      setSelectedVariants([]);
      return;
    }
    if (loading) return;

    const decoded = decodeURIComponent(featParam);
    const found =
      listFeats.find((feat) => feat.name.toLowerCase() === decoded.toLowerCase()) ??
      feats.find((feat) => feat.name.toLowerCase() === decoded.toLowerCase());
    if (!found || (selected?.name === found.name && dialogOpen)) return;

    setSelected(found);
    setDialogOpen(true);
    void getDndFeatsByName(found.name).then(setSelectedVariants);
  }, [featParam, loading, listFeats, feats, selected?.name, dialogOpen]);

  const handleSelect = useCallback(
    (feat: DndFeat) => openFeat(feat),
    [openFeat],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(null);
        setSelectedVariants([]);
        setFeatParam(null);
      }
    },
    [setFeatParam],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      filter: (typeof values.filter === "string"
        ? values.filter
        : "") as DndFeatFilter,
      src: Array.isArray(values.src) ? values.src : [],
    });
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
          searchPlaceholder="Search feat..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{ filter, src: sourceFilter }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Feat Filters"
          dialogDescription="Filter official feats by type and sourcebook. Changes apply when you save."
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

      {dialogOpen && selected && (
        <DndFeatDetailDialog
          key={selected.id}
          feat={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </div>
  );
}
