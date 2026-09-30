import { useCallback, useDeferredValue, useMemo } from "react";
import type { DndBackground } from "@/shared/types";
import { DND_BACKGROUND_EDITION_LABELS } from "@/shared/types";
import { ScrollText } from "lucide-react";
import {
  getAllDndBackgrounds,
  getDndBackgroundsByName,
  getListDndBackgrounds,
} from "../services/dnd-background.service";
import { useCompendiumListPage } from "@/shared/hooks/useCompendiumListPage";
import {
  ListSearchWithFilters,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import {
  DeferredListResults,
  StickyListSearchBar,
} from "@/shared/components/DeferredListResults";
import { collectEntitySources } from "@/shared/services/source-catalog.service";
import { DndBackgroundDataTable } from "./DndBackgroundDataTable";
import { DndBackgroundDetailDialog } from "./DndBackgroundDetailDialog";

const EDITION_OPTIONS = (
  Object.entries(DND_BACKGROUND_EDITION_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));

export function DndBackgroundList() {
  const {
    all: backgrounds,
    list: listBackgrounds,
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
  } = useCompendiumListPage<DndBackground>({
    session: {
      listId: "dnd-backgrounds",
      multiKeys: ["ed", "src"],
      urlPreserveKeys: ["background"],
    },
    load: async () => {
      const [all, list] = await Promise.all([
        getAllDndBackgrounds(),
        getListDndBackgrounds(),
      ]);
      return {
        all,
        list,
        filterSourceCodes: collectEntitySources(list),
      };
    },
    urlDialog: {
      paramKey: "background",
      getVariantsByName: getDndBackgroundsByName,
    },
  });

  const editions = getAll("ed");

  const filterSections = useMemo(
    () => [
      {
        id: "ed",
        title: "Edition",
        mode: "multi" as const,
        options: EDITION_OPTIONS,
      },
      sourceSection,
    ],
    [sourceSection],
  );

  const filterInput = useMemo(
    () => ({ appliedSearch, editions, sourceMatcher }),
    [appliedSearch, editions, sourceMatcher],
  );
  const deferredInput = useDeferredValue(filterInput);
  const deferredList = useDeferredValue(listBackgrounds);
  const isFilterDeferred =
    deferredInput !== filterInput || deferredList !== listBackgrounds;

  const filtered = useMemo(() => {
    let result = deferredList;
    const { appliedSearch: search, editions: editionVals, sourceMatcher: matcher } =
      deferredInput;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (bg) =>
          (bg.searchText?.includes(q) ?? false) ||
          bg.name.toLowerCase().includes(q) ||
          (bg.abilitySummary?.toLowerCase().includes(q) ?? false) ||
          (bg.featSummary?.toLowerCase().includes(q) ?? false) ||
          (bg.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (editionVals.length > 0) {
      const editionSet = new Set(editionVals);
      result = result.filter(
        (bg) => bg.edition != null && editionSet.has(bg.edition),
      );
    }

    if (matcher) {
      result = result.filter((bg) => matcher(bg));
    }

    return result;
  }, [deferredList, deferredInput]);

  const handleSelect = useCallback(
    (background: DndBackground) => dialog?.openItem(background),
    [dialog],
  );

  function applyDialogFilters(values: ListFilterValues) {
    patchFilters({
      ed: Array.isArray(values.ed) ? values.ed : [],
      src: Array.isArray(values.src) ? values.src : [],
    });
  }

  const showUpdating = isSearchPending || isFilterDeferred;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-5">
        <div className="mb-1 flex items-center gap-3">
          <ScrollText className="h-6 w-6 shrink-0 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">
            Backgrounds (D&amp;D 5e)
          </h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {listBackgrounds.length}
              {listBackgrounds.length < backgrounds.length && (
                <span className="opacity-70">
                  {" "}
                  ({backgrounds.length} entries)
                </span>
              )}
            </span>
          )}
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Official character backgrounds from D&amp;D 5e sourcebooks.
        </p>
      </div>

      <StickyListSearchBar updating={showUpdating && !loading}>
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search name, skills, tools..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={{
            ed: editions,
            src: sourceFilter,
          }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Background Filters"
          dialogDescription="Filter by edition and sourcebook. Changes apply when you save."
        />
      </StickyListSearchBar>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <DeferredListResults
          loading={loading}
          updating={showUpdating}
          isEmpty={listBackgrounds.length === 0}
          empty={
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ScrollText className="h-10 w-10 opacity-20" />
              <p className="text-sm">No backgrounds loaded.</p>
            </div>
          }
        >
          <DndBackgroundDataTable
            backgrounds={filtered}
            onRowClick={handleSelect}
          />
        </DeferredListResults>
      </div>

      {dialog?.dialogOpen && dialog.selected && (
        <DndBackgroundDetailDialog
          key={dialog.selected.id}
          background={dialog.selected}
          variants={dialog.selectedVariants}
          open={dialog.dialogOpen}
          onOpenChange={dialog.handleDialogOpenChange}
        />
      )}
    </div>
  );
}
