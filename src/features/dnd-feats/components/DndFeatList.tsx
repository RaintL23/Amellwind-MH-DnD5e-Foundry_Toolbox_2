import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { DndFeat } from "@/shared/types";
import {
  getAllDndFeats,
  getDndFeatsByName,
  getListDndFeats,
} from "../services/dnd-feat.service";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { DndFeatCard } from "./DndFeatCard";
import { DndFeatDetailDialog } from "./DndFeatDetailDialog";
import { Award } from "lucide-react";
import {
  buildSourceOptions,
  collectEntitySources,
} from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { appendAll, setIfPresent } from "@/shared/utils/list-url-params.utils";

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

export function DndFeatList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [feats, setFeats] = useState<DndFeat[]>([]);
  const [listFeats, setListFeats] = useState<DndFeat[]>([]);
  const [loading, setLoading] = useState(true);
  const search = searchParams.get("q") ?? "";
  const filter = (searchParams.get("filter") ?? "") as DndFeatFilter;
  const sourceFilter = searchParams.getAll("src");
  const [selected, setSelected] = useState<DndFeat | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<DndFeat[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const bookNames = useBookSourceNames();

  useEffect(() => {
    Promise.all([getAllDndFeats(), getListDndFeats()])
      .then(([all, list]) => {
        setFeats(all);
        setListFeats(list);
      })
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const patchFilters = useCallback(
    (patch: { q?: string; filter?: DndFeatFilter; src?: string[] }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          const q = "q" in patch ? (patch.q ?? "") : (prev.get("q") ?? "");
          const nextFilter =
            "filter" in patch
              ? (patch.filter ?? "")
              : (prev.get("filter") ?? "");
          const src =
            "src" in patch ? (patch.src ?? []) : prev.getAll("src");
          setIfPresent(next, "q", q);
          setIfPresent(next, "filter", nextFilter);
          appendAll(next, "src", src);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listFeats), bookNames),
    [listFeats, bookNames],
  );

  const filterSections = useMemo(
    () => [
      {
        id: "filter",
        title: "Feat Type",
        mode: "single" as const,
        options: FEAT_TYPE_OPTIONS,
      },
      {
        id: "src",
        title: "Source",
        mode: "multi" as const,
        options: sourceOptions,
      },
    ],
    [sourceOptions],
  );

  const filtered = useMemo(() => {
    let result = listFeats;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
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
      result = result.filter((f) => {
        const sources = f.variantSources ?? [f.source];
        return sources.some((s) => sourceFilter.includes(s));
      });
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
  }, [listFeats, debouncedSearch, filter, sourceFilter]);

  const handleSelect = useCallback((item: DndFeat) => {
    setSelected(item);
    setDialogOpen(true);
    void getDndFeatsByName(item.name).then(setSelectedVariants);
  }, []);

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
          searchValue={search}
          onSearchChange={(q) => patchFilters({ q })}
          searchPlaceholder="Search feat..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{ filter, src: sourceFilter }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Feat Filters"
          dialogDescription="Filter official feats by type and sourcebook."
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm">Loading feats...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Award className="h-10 w-10 opacity-20" />
            <p className="text-sm">No feats found with those filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <DndFeatCard
                key={item.id}
                feat={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && selected && (
        <DndFeatDetailDialog
          key={selected.id}
          feat={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
