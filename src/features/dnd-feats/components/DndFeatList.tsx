import { useCallback, useEffect, useMemo, useState } from "react";
import type { DndFeat } from "@/shared/types";
import {
  getAllDndFeats,
  getDndFeatsByName,
  getListDndFeats,
} from "../services/dnd-feat.service";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { DndFeatCard } from "./DndFeatCard";
import { DndFeatDetailDialog } from "./DndFeatDetailDialog";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Search, Award } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  buildSourceOptions,
  collectEntitySources,
} from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";

type DndFeatFilter =
  | ""
  | "origin"
  | "repeatable"
  | "ability"
  | "prerequisite";

const FILTERS: Array<{ value: DndFeatFilter; label: string }> = [
  { value: "", label: "All" },
  { value: "origin", label: "Origin Feats" },
  { value: "repeatable", label: "Repeatable" },
  { value: "ability", label: "With ability increases" },
  { value: "prerequisite", label: "With prerequisites" },
];

export function DndFeatList() {
  const [feats, setFeats] = useState<DndFeat[]>([]);
  const [listFeats, setListFeats] = useState<DndFeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DndFeatFilter>("");
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
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

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listFeats), bookNames),
    [listFeats, bookNames],
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

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feat..."
              className="pl-9 h-8 text-sm"
            />
          </div>

          {sourceOptions.length > 1 && (
            <MultiSelect
              options={sourceOptions}
              selected={sourceFilter}
              onChange={setSourceFilter}
              emptyLabel="All sources"
              allLabel="All sources"
              countLabel={(count) => `${count} sources`}
              className="w-auto min-w-[180px] max-w-[260px] [&>button]:h-8 [&>button]:text-xs"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                filter === value
                  ? "border-amber-500 bg-amber-500/20 text-amber-400"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {label}
            </button>
          ))}
        </div>
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
