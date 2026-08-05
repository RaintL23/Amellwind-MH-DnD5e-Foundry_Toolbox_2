import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useMemo } from "react";
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
import { useCompendiumListPage } from "@/shared/hooks/useCompendiumListPage";
import {
  ListSearchWithFilters,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import { SIZE_FILTER_OPTIONS } from "@/features/bestiary/components/bestiary-columns";
import { DndRaceDataTable } from "./DndRaceDataTable";
import { DndRaceDetailDialog } from "@/features/dnd-races/components/DndRaceDetailDialog";

const KIND_OPTIONS = (
  Object.entries(DND_RACE_KIND_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));

const SIZE_OPTIONS = SIZE_FILTER_OPTIONS.filter((o) => o.value !== "");

export function DndRaceList() {
  const {
    all: races,
    list: listRaces,
    loading,
    getAll,
    patchFilters,
    sourceFilter,
    sourceSection,
    matchesSourceFilter,
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    dialog,
  } = useCompendiumListPage<DndRace>({
    session: {
      listId: "dnd-races",
      multiKeys: ["kind", "sz", "src"],
      urlPreserveKeys: ["race"],
    },
    load: async () => {
      const [all, list, codes] = await Promise.all([
        getAllDndRaces(),
        getListDndRaces(),
        getDndRaceFilterSourceCodes(),
      ]);
      return { all, list, filterSourceCodes: codes };
    },
    ensureSourcesLoaded: (sources) => ensureDndRaceUaSourcesLoaded(sources),
    urlDialog: {
      paramKey: "race",
      getVariantsByName: getDndRacesByName,
    },
  });

  const kinds = getAll("kind");
  const sizes = getAll("sz");

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
      result = result.filter((race) => matchesSourceFilter(race, sourceFilter));
    }

    return result;
  }, [listRaces, appliedSearch, kinds, sizes, sourceFilter, matchesSourceFilter]);

  const handleSelect = useCallback(
    (race: DndRace) => dialog?.openItem(race),
    [dialog],
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

      {dialog?.dialogOpen && dialog.selected && (
        <DndRaceDetailDialog
          key={dialog.selected.id}
          race={dialog.selected}
          variants={dialog.selectedVariants}
          open={dialog.dialogOpen}
          onOpenChange={dialog.handleDialogOpenChange}
        />
      )}
    </div>
  );
}
