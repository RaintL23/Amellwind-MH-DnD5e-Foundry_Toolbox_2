import { useCallback, useDeferredValue, useMemo } from "react";
import { Spell } from "@/shared/types";
import {
  ensureSpellUaSourcesLoaded,
  getAllSpells,
  getListSpells,
  getSpellFilterSourceCodes,
  getSpellsByName,
} from "../services/spell.service";
import { useCompendiumListPage } from "@/shared/hooks/useCompendiumListPage";
import {
  ListSearchWithFilters,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import {
  DeferredListResults,
  StickyListSearchBar,
} from "@/shared/components/DeferredListResults";
import {
  buildSpellFacetFilterSections,
  collectSpellPresentFacets,
  SPELL_LIST_MULTI_KEYS,
  spellMatchesFacetFilters,
  type SpellListMultiKey,
} from "../utils/spell-list-filters";
import { SPELL_LIST_FILTER_CLASSES } from "../utils/spell-class.constants";
import { SpellDetailDialog } from "./SpellDetailDialog";
import { SpellDataTable } from "./SpellDataTable";
import { Sparkles } from "lucide-react";

const SPELL_URL_PARAM = "spell";

export function SpellList() {
  const {
    all: spells,
    list: listSpells,
    loading,
    getAll,
    patchFilters,
    sourceSection,
    sourceMatcher,
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    dialog,
  } = useCompendiumListPage<Spell>({
    session: {
      listId: "spells",
      multiKeys: SPELL_LIST_MULTI_KEYS,
      urlPreserveKeys: [SPELL_URL_PARAM],
    },
    load: async () => {
      const [all, list, codes] = await Promise.all([
        getAllSpells(),
        getListSpells(),
        getSpellFilterSourceCodes(),
      ]);
      return { all, list, filterSourceCodes: codes };
    },
    ensureSourcesLoaded: (sources) => ensureSpellUaSourcesLoaded(sources),
    urlDialog: {
      paramKey: SPELL_URL_PARAM,
      getVariantsByName: getSpellsByName,
    },
  });

  const multi = useMemo(() => {
    const out = {} as Record<SpellListMultiKey, string[]>;
    for (const key of SPELL_LIST_MULTI_KEYS) out[key] = getAll(key);
    return out;
  }, [getAll]);

  const classOptions = useMemo(() => {
    const present = new Set<string>();
    for (const spell of listSpells) {
      for (const name of spell.classNames) present.add(name);
    }
    return SPELL_LIST_FILTER_CLASSES.filter((name) => present.has(name)).map(
      (name) => ({ value: name, label: name }),
    );
  }, [listSpells]);

  const presentFacets = useMemo(
    () => collectSpellPresentFacets(listSpells),
    [listSpells],
  );

  const filterSections = useMemo(
    () =>
      buildSpellFacetFilterSections(presentFacets, {
        includeLevel: true,
        classOptions,
        sourceSection,
      }),
    [classOptions, presentFacets, sourceSection],
  );

  const filterValues = useMemo(() => {
    const values: ListFilterValues = {};
    for (const key of SPELL_LIST_MULTI_KEYS) values[key] = multi[key];
    return values;
  }, [multi]);

  const filterInput = useMemo(
    () => ({ appliedSearch, filterValues, sourceMatcher }),
    [appliedSearch, filterValues, sourceMatcher],
  );
  const deferredInput = useDeferredValue(filterInput);
  const deferredList = useDeferredValue(listSpells);
  const isFilterDeferred =
    deferredInput !== filterInput || deferredList !== listSpells;

  const filtered = useMemo(() => {
    let result = deferredList;

    if (deferredInput.appliedSearch.trim()) {
      const query = deferredInput.appliedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.searchText ?? s.summary).toLowerCase().includes(query) ||
          s.schoolName.toLowerCase().includes(query) ||
          s.classNames.some((c) => c.toLowerCase().includes(query)),
      );
    }

    const matcher = deferredInput.sourceMatcher;
    result = result.filter((s) =>
      spellMatchesFacetFilters(s, deferredInput.filterValues, {
        sourceMatcher: matcher
          ? (spell, _selected) => matcher(spell)
          : undefined,
      }),
    );

    return result;
  }, [deferredList, deferredInput]);

  const handleSelect = useCallback(
    (spell: Spell) => {
      dialog?.openItem(spell);
    },
    [dialog],
  );

  function applyDialogFilters(values: ListFilterValues) {
    const patch = {} as Partial<Record<SpellListMultiKey, string[]>>;
    for (const key of SPELL_LIST_MULTI_KEYS) {
      patch[key] = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    }
    patchFilters(patch);
  }

  const showUpdating = isSearchPending || isFilterDeferred;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-5">
        <div className="mb-1 flex items-center gap-3">
          <Sparkles className="h-6 w-6 shrink-0 text-violet-400" />
          <h1 className="text-xl font-bold text-foreground">Spells (D&amp;D 5e)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {listSpells.length}
              {listSpells.length < spells.length && (
                <span className="opacity-70"> ({spells.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          One row per spell name; open a spell to compare sources (PHB, XPHB, etc.).
        </p>
      </div>

      <StickyListSearchBar updating={showUpdating && !loading}>
        <ListSearchWithFilters
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search name, school, class..."
          inputClassName="h-8 text-sm"
          sections={filterSections}
          filterValues={filterValues}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Spell Filters"
          dialogDescription="Filter like 5etools: level, class, school, components, damage, saves, cast time, and more. Changes apply when you save."
        />
      </StickyListSearchBar>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <DeferredListResults
          loading={loading}
          updating={showUpdating}
          isEmpty={listSpells.length === 0}
          empty={
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="h-10 w-10 opacity-20" />
              <p className="text-sm">No spells loaded.</p>
            </div>
          }
        >
          <SpellDataTable spells={filtered} onRowClick={handleSelect} />
        </DeferredListResults>
      </div>

      {dialog?.dialogOpen && dialog.selected && (
        <SpellDetailDialog
          key={dialog.selected.id}
          spell={dialog.selected}
          variants={dialog.selectedVariants}
          open={dialog.dialogOpen}
          onOpenChange={dialog.handleDialogOpenChange}
        />
      )}
    </div>
  );
}
