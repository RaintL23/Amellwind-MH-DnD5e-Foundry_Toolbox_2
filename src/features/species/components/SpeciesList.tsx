import { useEffect, useMemo, useState } from "react";
import {
  Species,
  SpeciesCategory,
  SPECIES_CATEGORY_LABELS,
} from "@/shared/types";
import { getAllSpecies } from "../services/species.service";
import { SpeciesCard } from "./SpeciesCard";
import { SpeciesDetailDialog } from "./SpeciesDetailDialog";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const CATEGORY_FILTERS: Array<{ value: "" | SpeciesCategory; label: string }> =
  [
    { value: "", label: "All" },
    { value: "ancestry", label: SPECIES_CATEGORY_LABELS.ancestry },
    { value: "folk", label: SPECIES_CATEGORY_LABELS.folk },
    { value: "elder-dragon", label: SPECIES_CATEGORY_LABELS["elder-dragon"] },
    { value: "subrace", label: SPECIES_CATEGORY_LABELS.subrace },
    { value: "lineage", label: SPECIES_CATEGORY_LABELS.lineage },
  ];

type ViewMode = "All" | "Roots" | "Subraces";

export function SpeciesList() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"" | SpeciesCategory>(
    "",
  );
  const [parentFilter, setParentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("All");
  const [selected, setSelected] = useState<Species | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllSpecies()
      .then(setSpecies)
      .finally(() => setLoading(false));
  }, []);

  const parentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of species) {
      if (!s.parentSpecies) continue;
      set.add(
        s.parentSource
          ? `${s.parentSpecies} (${s.parentSource})`
          : s.parentSpecies,
      );
    }
    return Array.from(set).sort();
  }, [species]);

  const filtered = useMemo(() => {
    let result = species;

    if (viewMode === "Roots") result = result.filter((s) => !s.isSubrace);
    if (viewMode === "Subraces") result = result.filter((s) => s.isSubrace);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.parentSpecies?.toLowerCase().includes(q) ||
          s.fluff.toLowerCase().includes(q),
      );
    }

    if (categoryFilter) {
      result = result.filter((s) => s.category === categoryFilter);
    }

    if (parentFilter) {
      result = result.filter(
        (s) =>
          s.parentSpecies === parentFilter ||
          `${s.parentSpecies} (${s.parentSource})` === parentFilter,
      );
    }

    return [...result].sort((a, b) => {
      const parentCmp = (a.parentSpecies ?? a.name).localeCompare(
        b.parentSpecies ?? b.name,
      );
      if (parentCmp !== 0) return parentCmp;
      return a.name.localeCompare(b.name);
    });
  }, [species, search, categoryFilter, parentFilter, viewMode]);

  function handleSelect(item: Species) {
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Species</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {species.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Species and lineages from Amellwind&apos;s Guide to Monster Hunting
          (D&amp;D 2024: species). Includes ancestries, folk, elder dragonborn
          and subraces.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search species..."
              className="pl-9 h-8 text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { value: "All", label: "All" },
                { value: "Roots", label: "Roots" },
                { value: "Subraces", label: "Subraces" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setViewMode(value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  viewMode === value
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {parentOptions.length > 0 && (
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All roots</option>
              {parentOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {CATEGORY_FILTERS.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setCategoryFilter(value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                categoryFilter === value
                  ? "border-primary bg-primary/20 text-primary"
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
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading species...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Users className="h-10 w-10 opacity-20" />
            <p className="text-sm">No species found with those filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <SpeciesCard
                key={item.id}
                species={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}
      </div>

      <SpeciesDetailDialog
        species={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
