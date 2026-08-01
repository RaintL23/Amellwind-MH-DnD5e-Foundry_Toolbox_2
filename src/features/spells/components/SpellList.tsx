import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spell } from "@/shared/types";
import {
  ensureSpellUaSourcesLoaded,
  getAllSpells,
  getListSpells,
  getSpellFilterSourceCodes,
  getSpellsByName,
} from "../services/spell.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import {
  ListSearchWithFilters,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import {
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";
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
  const [spells, setSpells] = useState<Spell[]>([]);
  const [listSpells, setListSpells] = useState<Spell[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Spell | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Spell[]>([]);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const { q, getAll, patchFilters, ensureMultiIfEmpty } = useListSessionFilters({
    listId: "spells",
    multiKeys: SPELL_LIST_MULTI_KEYS,
    urlPreserveKeys: [SPELL_URL_PARAM],
  });
  const { value: spellParam, setValue: setSpellParam } =
    useListItemUrlParam(SPELL_URL_PARAM);

  const multi = useMemo(() => {
    const out = {} as Record<SpellListMultiKey, string[]>;
    for (const key of SPELL_LIST_MULTI_KEYS) out[key] = getAll(key);
    return out;
  }, [getAll]);

  const refresh = useCallback(async () => {
    const [all, list, codes] = await Promise.all([
      getAllSpells(),
      getListSpells(),
      getSpellFilterSourceCodes(),
    ]);
    setSpells(all);
    setListSpells(list);
    setFilterSourceCodes(codes);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (
      multi.src.length > 0 ||
      catalog.size === 0 ||
      filterSourceCodes.length === 0
    ) {
      return;
    }
    const defaults = defaultOfficialSourceCodes(filterSourceCodes, catalog);
    if (defaults.length === 0) return;
    ensureMultiIfEmpty("src", defaults);
  }, [catalog, filterSourceCodes, multi.src.length, ensureMultiIfEmpty]);

  useEffect(() => {
    if (multi.src.length === 0) return;
    void ensureSpellUaSourcesLoaded(multi.src).then((changed) => {
      if (changed) void refresh();
    });
  }, [multi.src, refresh]);

  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);

  const openSpell = useCallback(
    (spell: Spell) => {
      setSelected(spell);
      setDialogOpen(true);
      setSpellParam(spell.name);
      void getSpellsByName(spell.name).then(setSelectedVariants);
    },
    [setSpellParam],
  );

  useEffect(() => {
    if (!spellParam) {
      setDialogOpen(false);
      setSelected(null);
      setSelectedVariants([]);
      return;
    }
    if (loading) return;

    const decoded = decodeURIComponent(spellParam);
    const found =
      listSpells.find((s) => s.name.toLowerCase() === decoded.toLowerCase()) ??
      spells.find((s) => s.name.toLowerCase() === decoded.toLowerCase());
    if (!found) return;
    if (selected?.name === found.name && dialogOpen) return;

    setSelected(found);
    setDialogOpen(true);
    void getSpellsByName(found.name).then(setSelectedVariants);
  }, [spellParam, loading, listSpells, spells, selected?.name, dialogOpen]);

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

  const sourceSection = useMemo(
    () => buildSourcesFilterSection(filterSourceCodes, catalog, bookNames),
    [filterSourceCodes, catalog, bookNames],
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
      openSpell(spell);
    },
    [openSpell],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(null);
        setSelectedVariants([]);
        setSpellParam(null);
      }
    },
    [setSpellParam],
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

      {dialogOpen && selected && (
        <SpellDetailDialog
          key={selected.id}
          spell={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </div>
  );
}
