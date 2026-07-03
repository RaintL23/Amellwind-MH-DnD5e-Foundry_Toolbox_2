import { useEffect, useMemo, useState } from "react";
import {
  Species,
  SpeciesCategory,
  SPECIES_CATEGORY_LABELS,
} from "@/shared/types";
import { getAllSpecies } from "../services/species.service";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useListUrlState } from "@/shared/hooks/useListUrlState";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { SpeciesCard } from "./SpeciesCard";
import { SpeciesDetailDialog } from "./SpeciesDetailDialog";
import { Users } from "lucide-react";

type ViewMode = "All" | "Roots" | "Subraces";

const VIEW_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Roots", label: "Roots" },
  { value: "Subraces", label: "Subraces" },
];

const CATEGORY_OPTIONS = (
  Object.entries(SPECIES_CATEGORY_LABELS) as Array<[SpeciesCategory, string]>
).map(([value, label]) => ({ value, label }));

export function SpeciesList() {
  const { getString, setString, patchFields } = useListUrlState();
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const search = getString("q");
  const categoryFilter = getString("category") as "" | SpeciesCategory;
  const parentFilter = getString("parent");
  const viewMode = (getString("view", "All") || "All") as ViewMode;
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

  const filterSections = useMemo(
    () => [
      { id: "view", title: "View", mode: "single" as const, options: VIEW_OPTIONS },
      {
        id: "category",
        title: "Category",
        mode: "single" as const,
        options: CATEGORY_OPTIONS,
      },
      {
        id: "parent",
        title: "Parent Species",
        mode: "single" as const,
        options: parentOptions.map((parent) => ({
          value: parent,
          label: parent,
        })),
      },
    ],
    [parentOptions],
  );

  const debouncedSearch = useDebouncedValue(search);

  const filtered = useMemo(() => {
    let result = species;

    if (viewMode === "Roots") result = result.filter((s) => !s.isSubrace);
    if (viewMode === "Subraces") result = result.filter((s) => s.isSubrace);

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
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
  }, [species, debouncedSearch, categoryFilter, parentFilter, viewMode]);

  function handleSelect(item: Species) {
    setSelected(item);
    setDialogOpen(true);
  }

  function applyDialogFilters(values: ListFilterValues) {
    const view =
      typeof values.view === "string" && values.view !== "All"
        ? values.view
        : "";
    const category = typeof values.category === "string" ? values.category : "";
    const parent = typeof values.parent === "string" ? values.parent : "";
    patchFields({ view, category, parent });
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

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <ListSearchWithFilters
          searchValue={search}
          onSearchChange={(q) => setString("q", q)}
          searchPlaceholder="Search species..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            view: viewMode,
            category: categoryFilter,
            parent: parentFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Species Filters"
          dialogDescription="Filter by view mode, category, and parent species."
        />
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

      {dialogOpen && selected && (
        <SpeciesDetailDialog
          species={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
