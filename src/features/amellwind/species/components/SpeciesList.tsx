import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Species,
  SpeciesCategory,
  SPECIES_CATEGORY_LABELS,
} from "@/shared/types";
import { getAllSpecies } from "../services/species.service";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { SpeciesCard } from "./SpeciesCard";
import { SpeciesDetailDialog } from "./SpeciesDetailDialog";
import { Users } from "lucide-react";
import { GtmhSourceNotice } from "@/shared/components/GtmhSourceNotice";

const CATEGORY_OPTIONS = (
  Object.entries(SPECIES_CATEGORY_LABELS) as Array<[SpeciesCategory, string]>
).map(([value, label]) => ({ value, label }));

function matchesQuery(item: Species, query: string): boolean {
  return (
    item.name.toLowerCase().includes(query) ||
    item.parentSpecies?.toLowerCase().includes(query) === true ||
    item.fluff.toLowerCase().includes(query)
  );
}

/**
 * Catalog cards: local root species, plus subspecies whose parent is not in
 * this catalog (e.g. Elder Dragonborn → PHB Dragonborn).
 */
function buildCatalogEntries(all: Species[]): Species[] {
  const roots = all.filter((item) => !item.isSubrace);
  const rootNames = new Set(roots.map((item) => item.name.toLowerCase()));
  const orphans = all.filter(
    (item) =>
      item.isSubrace &&
      (!item.parentSpecies ||
        !rootNames.has(item.parentSpecies.toLowerCase())),
  );
  return [...roots, ...orphans].sort((a, b) => a.name.localeCompare(b.name));
}

export function SpeciesList() {
  const { q, getString, patchFilters } = useListSessionFilters({
    listId: "mh-species",
    stringKeys: ["q", "category"],
    multiKeys: [],
    urlPreserveKeys: ["species"],
  });
  const { value: urlSpecies, setValue: setUrlSpecies } =
    useListItemUrlParam("species");
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);
  const categoryFilter = getString("category") as "" | SpeciesCategory;
  const [selected, setSelected] = useState<Species | null>(null);
  const [initialSubspeciesId, setInitialSubspeciesId] = useState<string | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllSpecies()
      .then(setSpecies)
      .finally(() => setLoading(false));
  }, []);

  const catalog = useMemo(() => buildCatalogEntries(species), [species]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Species[]>();
    for (const item of species) {
      if (!item.isSubrace || !item.parentSpecies) continue;
      const key = item.parentSpecies.toLowerCase();
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [species]);

  const openSpecies = useCallback(
    (item: Species, subspeciesId: string | null = null) => {
      setSelected(item);
      setInitialSubspeciesId(subspeciesId);
      setDialogOpen(true);
      if (subspeciesId) {
        const sub = species.find((s) => s.id === subspeciesId);
        setUrlSpecies(sub?.name ?? item.name);
      } else {
        setUrlSpecies(item.name);
      }
    },
    [setUrlSpecies, species],
  );

  useEffect(() => {
    if (!urlSpecies) {
      setDialogOpen(false);
      setSelected(null);
      setInitialSubspeciesId(null);
      return;
    }
    if (loading) return;

    const found = species.find(
      (item) => item.name.toLowerCase() === urlSpecies.toLowerCase(),
    );
    if (!found) return;

    // Subspecies with a local base → open the base dialog on that subspecies.
    if (found.isSubrace && found.parentSpecies) {
      const parent = catalog.find(
        (item) =>
          !item.isSubrace &&
          item.name.toLowerCase() === found.parentSpecies!.toLowerCase(),
      );
      if (parent) {
        setSelected(parent);
        setInitialSubspeciesId(found.id);
        setDialogOpen(true);
        return;
      }
    }

    setSelected(found);
    setInitialSubspeciesId(null);
    setDialogOpen(true);
  }, [urlSpecies, species, loading, catalog]);

  const filterSections = useMemo(
    () => [
      {
        id: "category",
        title: "Category",
        mode: "single" as const,
        options: CATEGORY_OPTIONS,
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    let result = catalog;
    const query = appliedSearch.trim().toLowerCase();

    if (query) {
      result = result.filter((item) => {
        if (matchesQuery(item, query)) return true;
        if (item.isSubrace) return false;
        const children = childrenByParent.get(item.name.toLowerCase()) ?? [];
        return children.some((child) => matchesQuery(child, query));
      });
    }

    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter);
    }

    return result;
  }, [catalog, appliedSearch, categoryFilter, childrenByParent]);

  function applyDialogFilters(values: ListFilterValues) {
    const category = typeof values.category === "string" ? values.category : "";
    patchFilters({ category });
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
        <GtmhSourceNotice className="mb-3" />
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search species..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            category: categoryFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Species Filters"
          dialogDescription="Filter by category."
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading variant="cards" />
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
                onClick={() => openSpecies(item)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && selected && (
        <SpeciesDetailDialog
          species={selected}
          open={dialogOpen}
          initialSubspeciesId={initialSubspeciesId}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setUrlSpecies(null);
              setInitialSubspeciesId(null);
            }
          }}
        />
      )}
    </div>
  );
}
