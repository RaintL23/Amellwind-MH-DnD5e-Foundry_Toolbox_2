import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useMemo } from "react";
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
  collectEntitySources,
} from "@/shared/services/source-catalog.service";
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
    matchesSourceFilter,
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

  const filtered = useMemo(() => {
    let result = listBackgrounds;

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter(
        (bg) =>
          (bg.searchText?.includes(q) ?? false) ||
          bg.name.toLowerCase().includes(q) ||
          (bg.abilitySummary?.toLowerCase().includes(q) ?? false) ||
          (bg.featSummary?.toLowerCase().includes(q) ?? false) ||
          (bg.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false),
      );
    }

    if (editions.length > 0) {
      result = result.filter(
        (bg) => bg.edition != null && editions.includes(bg.edition),
      );
    }

    if (sourceFilter.length > 0) {
      result = result.filter((bg) => matchesSourceFilter(bg, sourceFilter));
    }

    return result;
  }, [listBackgrounds, appliedSearch, editions, sourceFilter, matchesSourceFilter]);

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <ScrollText className="h-6 w-6 text-amber-400" />
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
        <p className="text-sm text-muted-foreground">
          Official character backgrounds from D&amp;D 5e sourcebooks.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
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
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading />
        ) : listBackgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <ScrollText className="h-10 w-10 opacity-20" />
            <p className="text-sm">No backgrounds loaded.</p>
          </div>
        ) : (
          <DndBackgroundDataTable
            backgrounds={filtered}
            onRowClick={handleSelect}
          />
        )}
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
