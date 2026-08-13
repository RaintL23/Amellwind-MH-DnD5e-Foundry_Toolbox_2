import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useMemo } from "react";
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
import { entityMatchesSourceFilter } from "@/shared/utils/compendium-source-filter.utils";
import { SPELL_LIST_FILTER_CLASSES } from "../utils/spell-class.constants";
import {
  buildSpellFacetFilterSections,
  collectSpellPresentFacets,
  SPELL_LIST_MULTI_KEYS,
  spellMatchesFacetFilters,
  type SpellListMultiKey,
} from "../utils/spell-list-filters";
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
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    bookNames,
    catalog,
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

  const filtered = useMemo(() => {
    let result = listSpells;

    if (appliedSearch.trim()) {
      const query = appliedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.searchText ?? s.summary).toLowerCase().includes(query) ||
          s.schoolName.toLowerCase().includes(query) ||
          s.classNames.some((c) => c.toLowerCase().includes(query)),
      );
    }

    result = result.filter((s) =>
      spellMatchesFacetFilters(s, filterValues, {
        sourceMatcher: (spell, selected) =>
          entityMatchesSourceFilter(spell, selected, catalog, bookNames),
      }),
    );

    return result;
  }, [listSpells, appliedSearch, filterValues, catalog, bookNames]);

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-6 w-6 text-violet-400" />
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
        <p className="text-sm text-muted-foreground">
          One row per spell name; open a spell to compare sources (PHB, XPHB, etc.).
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
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
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading />
        ) : listSpells.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Sparkles className="h-10 w-10 opacity-20" />
            <p className="text-sm">No spells loaded.</p>
          </div>
        ) : (
          <SpellDataTable spells={filtered} onRowClick={handleSelect} />
        )}
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
