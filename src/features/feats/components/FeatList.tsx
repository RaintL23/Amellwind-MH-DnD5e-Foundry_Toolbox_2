import { useEffect, useMemo, useState } from "react";
import { Feat } from "@/shared/types";
import { getAllFeats } from "../services/feat.service";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useListUrlState } from "@/shared/hooks/useListUrlState";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { FeatCard } from "./FeatCard";
import { FeatDetailDialog } from "./FeatDetailDialog";
import { Award } from "lucide-react";

type FeatFilter = "" | "repeatable" | "ability" | "prerequisite";

const FEAT_FILTER_OPTIONS = [
  { value: "repeatable", label: "Repeatable" },
  { value: "ability", label: "With ability increases" },
  { value: "prerequisite", label: "With prerequisites" },
];

const FEAT_FILTER_SECTIONS = [
  {
    id: "filter",
    title: "Feat Type",
    mode: "single" as const,
    options: FEAT_FILTER_OPTIONS,
  },
];

export function FeatList() {
  const { getString, setString, patchFields } = useListUrlState();
  const [feats, setFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const search = getString("q");
  const filter = getString("filter") as FeatFilter;
  const [selected, setSelected] = useState<Feat | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllFeats()
      .then(setFeats)
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const filtered = useMemo(() => {
    let result = feats;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.summary.toLowerCase().includes(q) ||
          f.paragraphs.some((p) => p.toLowerCase().includes(q)) ||
          f.prerequisites.some((p) => p.toLowerCase().includes(q)),
      );
    }

    if (filter === "repeatable") {
      result = result.filter((f) => f.repeatable);
    } else if (filter === "ability") {
      result = result.filter((f) => f.abilityIncreases.length > 0);
    } else if (filter === "prerequisite") {
      result = result.filter((f) => f.prerequisites.length > 0);
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [feats, debouncedSearch, filter]);

  function handleSelect(item: Feat) {
    setSelected(item);
    setDialogOpen(true);
  }

  function applyDialogFilters(values: ListFilterValues) {
    const nextFilter =
      typeof values.filter === "string" ? values.filter : "";
    patchFields({ filter: nextFilter });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Award className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Feats (MH)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {feats.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Optional feats from Amellwind&apos;s Guide to Monster Hunting:
          weapons, mount, crafting and druid variants.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <ListSearchWithFilters
          searchValue={search}
          onSearchChange={(q) => setString("q", q)}
          searchPlaceholder="Search feat..."
          inputClassName="h-8 text-sm"
          sections={FEAT_FILTER_SECTIONS}
          filterValues={{ filter }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Feat Filters"
          dialogDescription="Filter feats by type and requirements."
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
              <FeatCard
                key={item.id}
                feat={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && selected && (
        <FeatDetailDialog
          feat={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
