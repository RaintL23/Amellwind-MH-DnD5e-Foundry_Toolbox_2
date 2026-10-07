import { useCallback, useDeferredValue, useMemo, useState } from "react";
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
import {
  DeferredListResults,
  StickyListSearchBar,
} from "@/shared/components/DeferredListResults";
import { SIZE_FILTER_OPTIONS } from "@/features/dnd/bestiary/components/bestiary-columns";
import { DndRaceDataTable } from "./DndRaceDataTable";
import { DndRaceDetailDialog } from "@/features/dnd/races/components/DndRaceDetailDialog";

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
    sourceMatcher,
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

  const filterInput = useMemo(
    () => ({ appliedSearch, kinds, sizes, sourceMatcher }),
    [appliedSearch, kinds, sizes, sourceMatcher],
  );
  const deferredInput = useDeferredValue(filterInput);
  const deferredList = useDeferredValue(listRaces);
  const isFilterDeferred =
    deferredInput !== filterInput || deferredList !== listRaces;

  const filtered = useMemo(() => {
    let result = deferredList;
    const { appliedSearch: search, kinds: kindVals, sizes: sizeVals, sourceMatcher: matcher } =
      deferredInput;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (race) =>
          (race.searchText?.includes(q) ?? false) ||
          race.name.toLowerCase().includes(q) ||
          (race.parentName?.toLowerCase().includes(q) ?? false) ||
          race.traitTags.some((t) => t.toLowerCase().includes(q)) ||
          (race.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (kindVals.length > 0) {
      const kindSet = new Set(kindVals);
      result = result.filter((race) => kindSet.has(race.kind));
    }

    if (sizeVals.length > 0) {
      const sizeSet = new Set(sizeVals);
      result = result.filter((race) =>
        race.sizes.some((s) => sizeSet.has(s)),
      );
    }

    if (matcher) {
      result = result.filter((race) => matcher(race));
    }

    return result;
  }, [deferredList, deferredInput]);

  const [initialSubraceName, setInitialSubraceName] = useState<string | null>(
    null,
  );

  // A subrace row opens its parent species at the subrace's source, with the subrace preselected.
  const handleSelect = useCallback(
    async (race: DndRace) => {
      if (!dialog) return;
      if (!race.parentName) {
        setInitialSubraceName(null);
        dialog.openItem(race);
        return;
      }
      const parents = (await getDndRacesByName(race.parentName)).filter(
        (r) => !r.parentName,
      );
      const parent =
        parents.find((r) => r.source === race.parentSource) ?? parents[0];
      setInitialSubraceName(parent ? race.name : null);
      dialog.openItem(parent ?? race);
    },
    [dialog],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setInitialSubraceName(null);
      dialog?.handleDialogOpenChange(open);
    },
    [dialog],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      kind: Array.isArray(values.kind) ? values.kind : [],
      sz: Array.isArray(values.sz) ? values.sz : [],
      src: Array.isArray(values.src) ? values.src : [],
    });
  }

  const showUpdating = isSearchPending || isFilterDeferred;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-5">
        <div className="mb-1 flex items-center gap-3">
          <Users className="h-6 w-6 shrink-0 text-emerald-400" />
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
        <p className="hidden text-sm text-muted-foreground sm:block">
          Official species, subraces, and lineages from D&amp;D 5e sourcebooks.
        </p>
      </div>

      <StickyListSearchBar updating={showUpdating && !loading}>
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
      </StickyListSearchBar>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <DeferredListResults
          loading={loading}
          updating={showUpdating}
          isEmpty={listRaces.length === 0}
          empty={
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-10 w-10 opacity-20" />
              <p className="text-sm">No races loaded.</p>
            </div>
          }
        >
          <DndRaceDataTable races={filtered} onRowClick={handleSelect} />
        </DeferredListResults>
      </div>

      {dialog?.dialogOpen && dialog.selected && (
        <DndRaceDetailDialog
          key={dialog.selected.id}
          race={dialog.selected}
          variants={dialog.selectedVariants}
          initialSubraceName={initialSubraceName}
          open={dialog.dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </div>
  );
}
