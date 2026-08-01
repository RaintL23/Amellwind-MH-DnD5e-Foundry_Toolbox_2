import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DndRace } from "@/shared/types";
import { DND_RACE_KIND_LABELS } from "@/shared/types";
import { Users } from "lucide-react";
import {
  ensureDndRaceUaSourcesLoaded,
  getAllDndRaces,
  getDndRaceFilterSourceCodes,
  getDndRacesByName,
  getListDndRaces,
} from "../services/dnd-race.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
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
import { SIZE_FILTER_OPTIONS } from "@/features/bestiary/components/bestiary-columns";
import { DndRaceDataTable } from "./DndRaceDataTable";
import { DndRaceDetailDialog } from "@/features/dnd-races/components/DndRaceDetailDialog";

const KIND_OPTIONS = (
  Object.entries(DND_RACE_KIND_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));

const SIZE_OPTIONS = SIZE_FILTER_OPTIONS.filter((o) => o.value !== "");

export function DndRaceList() {
  const [races, setRaces] = useState<DndRace[]>([]);
  const [listRaces, setListRaces] = useState<DndRace[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DndRace | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<DndRace[]>([]);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const { q, getAll, patchFilters, ensureMultiIfEmpty } = useListSessionFilters({
    listId: "dnd-races",
    multiKeys: ["kind", "sz", "src"],
    urlPreserveKeys: ["race"],
  });
  const { value: raceParam, setValue: setRaceParam } = useListItemUrlParam("race");
  const kinds = getAll("kind");
  const sizes = getAll("sz");
  const sourceFilter = getAll("src");

  const refresh = useCallback(async () => {
    const [all, list, codes] = await Promise.all([
      getAllDndRaces(),
      getListDndRaces(),
      getDndRaceFilterSourceCodes(),
    ]);
    setRaces(all);
    setListRaces(list);
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
    void ensureDndRaceUaSourcesLoaded(sourceFilter).then((changed) => {
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
        id: "kind",
        title: "Kind",
        mode: "multi" as const,
        options: KIND_OPTIONS,
      },
      {
        id: "sz",
        title: "Size",
        mode: "multi" as const,
        options: SIZE_OPTIONS,
      },
      sourceSection,
    ],
    [sourceSection],
  );

  const filtered = useMemo(() => {
    let result = listRaces;

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter(
        (race) =>
          (race.searchText?.includes(q) ?? false) ||
          race.name.toLowerCase().includes(q) ||
          (race.parentName?.toLowerCase().includes(q) ?? false) ||
          race.traitTags.some((t) => t.toLowerCase().includes(q)) ||
          (race.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (kinds.length > 0) {
      result = result.filter((race) => kinds.includes(race.kind));
    }

    if (sizes.length > 0) {
      result = result.filter((race) =>
        race.sizes.some((s) => sizes.includes(s)),
      );
    }

    if (sourceFilter.length > 0) {
      result = result.filter((race) =>
        entityMatchesSourceFilter(race, sourceFilter, catalog, bookNames),
      );
    }

    return result;
  }, [listRaces, appliedSearch, kinds, sizes, sourceFilter, catalog, bookNames]);

  const openRace = useCallback(
    (race: DndRace) => {
      setSelected(race);
      setDialogOpen(true);
      setRaceParam(race.name);
      void getDndRacesByName(race.name).then(setSelectedVariants);
    },
    [setRaceParam],
  );

  useEffect(() => {
    if (!raceParam) {
      setDialogOpen(false);
      setSelected(null);
      setSelectedVariants([]);
      return;
    }
    if (loading) return;

    const decoded = decodeURIComponent(raceParam);
    const found =
      listRaces.find((race) => race.name.toLowerCase() === decoded.toLowerCase()) ??
      races.find((race) => race.name.toLowerCase() === decoded.toLowerCase());
    if (!found || (selected?.name === found.name && dialogOpen)) return;

    setSelected(found);
    setDialogOpen(true);
    void getDndRacesByName(found.name).then(setSelectedVariants);
  }, [raceParam, loading, listRaces, races, selected?.name, dialogOpen]);

  const handleSelect = useCallback(
    (race: DndRace) => openRace(race),
    [openRace],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(null);
        setSelectedVariants([]);
        setRaceParam(null);
      }
    },
    [setRaceParam],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      kind: Array.isArray(values.kind) ? values.kind : [],
      sz: Array.isArray(values.sz) ? values.sz : [],
      src: Array.isArray(values.src) ? values.src : [],
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-foreground">
            Races (D&amp;D 5e)
          </h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {listRaces.length}
              {listRaces.length < races.length && (
                <span className="opacity-70"> ({races.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Official species, subraces, and lineages from D&amp;D 5e sourcebooks.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search name, parent race, tags..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            kind: kinds,
            sz: sizes,
            src: sourceFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Race Filters"
          dialogDescription="Filter by kind, size, and sourcebook. Changes apply when you save."
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading />
        ) : listRaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Users className="h-10 w-10 opacity-20" />
            <p className="text-sm">No races loaded.</p>
          </div>
        ) : (
          <DndRaceDataTable races={filtered} onRowClick={handleSelect} />
        )}
      </div>

      {dialogOpen && selected && (
        <DndRaceDetailDialog
          key={selected.id}
          race={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </div>
  );
}
