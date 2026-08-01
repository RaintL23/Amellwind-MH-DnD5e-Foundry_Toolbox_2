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
  type ListFilterSectionConfig,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import {
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";
import { SPELL_LIST_FILTER_CLASSES } from "../utils/spell-class.constants";
import {
  labelAbilitySave,
  labelSpellMiscTag,
  optionsFromPresent,
  SPELL_AREA_LABELS,
  SPELL_ATTACK_LABELS,
  SPELL_CAST_TIME_LABELS,
  SPELL_DAMAGE_TYPES,
  SPELL_DURATION_BUCKETS,
  SPELL_MISC_TAG_LABELS,
  SPELL_RANGE_BUCKETS,
  SPELL_SAVE_ABILITIES,
} from "../utils/spell-filter.constants";
import { SpellDetailDialog } from "./SpellDetailDialog";
import { SpellDataTable } from "./SpellDataTable";
import { Sparkles } from "lucide-react";

const LEVEL_OPTIONS = [
  { value: "0", label: "Cantrip" },
  ...Array.from({ length: 9 }, (_, i) => ({
    value: String(i + 1),
    label: `Level ${i + 1}`,
  })),
];

const SCHOOL_OPTIONS = [
  { value: "A", label: "Abjuration" },
  { value: "C", label: "Conjuration" },
  { value: "D", label: "Divination" },
  { value: "E", label: "Enchantment" },
  { value: "V", label: "Evocation" },
  { value: "I", label: "Illusion" },
  { value: "N", label: "Necromancy" },
  { value: "T", label: "Transmutation" },
];

const MULTI_KEYS = [
  "lvl",
  "school",
  "class",
  "misc",
  "dmg",
  "cond",
  "atk",
  "save",
  "time",
  "dur",
  "rng",
  "area",
  "src",
] as const;

type MultiKey = (typeof MULTI_KEYS)[number];

const SPELL_URL_PARAM = "spell";

function matchesAny(selected: string[], values: string[]): boolean {
  if (selected.length === 0) return true;
  return values.some((v) => selected.includes(v));
}

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
    multiKeys: MULTI_KEYS,
    urlPreserveKeys: [SPELL_URL_PARAM],
  });
  const { value: spellParam, setValue: setSpellParam } =
    useListItemUrlParam(SPELL_URL_PARAM);

  const multi = useMemo(() => {
    const out = {} as Record<MultiKey, string[]>;
    for (const key of MULTI_KEYS) out[key] = getAll(key);
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

  const presentFacets = useMemo(() => {
    const misc = new Set<string>();
    const dmg = new Set<string>();
    const cond = new Set<string>();
    const atk = new Set<string>();
    const save = new Set<string>();
    const time = new Set<string>();
    const dur = new Set<string>();
    const rng = new Set<string>();
    const area = new Set<string>();
    for (const spell of listSpells) {
      for (const t of spell.filterTags) misc.add(t);
      for (const t of spell.damageTypes) dmg.add(t);
      for (const t of spell.conditions) cond.add(t);
      for (const t of spell.spellAttack) atk.add(t);
      for (const t of spell.savingThrows) save.add(t);
      for (const t of spell.castTimeUnits) time.add(t);
      dur.add(spell.durationBucket);
      rng.add(spell.rangeBucket);
      for (const t of spell.areaStyles) area.add(t);
    }
    return { misc, dmg, cond, atk, save, time, dur, rng, area };
  }, [listSpells]);

  const sourceSection = useMemo(
    () => buildSourcesFilterSection(filterSourceCodes, catalog, bookNames),
    [filterSourceCodes, catalog, bookNames],
  );

  const filterSections = useMemo((): ListFilterSectionConfig[] => {
    const miscOrder = Object.keys(SPELL_MISC_TAG_LABELS);
    return [
      { id: "lvl", title: "Level", mode: "multi", options: LEVEL_OPTIONS },
      {
        id: "class",
        title: "Class",
        mode: "multi",
        options: classOptions,
      },
      {
        id: "school",
        title: "School",
        mode: "multi",
        options: SCHOOL_OPTIONS,
      },
      {
        id: "misc",
        title: "Components & Miscellaneous",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.misc,
          Object.fromEntries(
            [...presentFacets.misc].map((t) => [t, labelSpellMiscTag(t)]),
          ),
          miscOrder,
        ),
      },
      {
        id: "dmg",
        title: "Damage Type",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.dmg,
          Object.fromEntries(
            [...presentFacets.dmg].map((t) => [
              t,
              t.charAt(0).toUpperCase() + t.slice(1),
            ]),
          ),
          SPELL_DAMAGE_TYPES,
        ),
      },
      {
        id: "cond",
        title: "Conditions Inflicted",
        mode: "multi",
        options: [...presentFacets.cond]
          .sort()
          .map((value) => ({
            value,
            label: value.charAt(0).toUpperCase() + value.slice(1),
          })),
      },
      {
        id: "atk",
        title: "Spell Attack",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.atk,
          SPELL_ATTACK_LABELS,
          ["M", "R", "O"],
        ),
      },
      {
        id: "save",
        title: "Saving Throw",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.save,
          Object.fromEntries(
            SPELL_SAVE_ABILITIES.map((a) => [a, labelAbilitySave(a)]),
          ),
          SPELL_SAVE_ABILITIES,
        ),
      },
      {
        id: "time",
        title: "Cast Time",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.time,
          SPELL_CAST_TIME_LABELS,
          Object.keys(SPELL_CAST_TIME_LABELS),
        ),
      },
      {
        id: "dur",
        title: "Duration",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.dur,
          Object.fromEntries(SPELL_DURATION_BUCKETS.map((b) => [b, b])),
          SPELL_DURATION_BUCKETS,
        ),
      },
      {
        id: "rng",
        title: "Range",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.rng,
          Object.fromEntries(SPELL_RANGE_BUCKETS.map((b) => [b, b])),
          SPELL_RANGE_BUCKETS,
        ),
      },
      {
        id: "area",
        title: "Area Style",
        mode: "multi",
        options: optionsFromPresent(
          presentFacets.area,
          SPELL_AREA_LABELS,
          Object.keys(SPELL_AREA_LABELS),
        ),
      },
      sourceSection,
    ];
  }, [classOptions, presentFacets, sourceSection]);

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

    if (multi.lvl.length > 0) {
      result = result.filter((s) => multi.lvl.includes(String(s.level)));
    }
    if (multi.school.length > 0) {
      result = result.filter((s) => multi.school.includes(s.school));
    }
    if (multi.class.length > 0) {
      result = result.filter((s) =>
        s.classNames.some((c) => multi.class.includes(c)),
      );
    }
    if (multi.misc.length > 0) {
      result = result.filter((s) => matchesAny(multi.misc, s.filterTags));
    }
    if (multi.dmg.length > 0) {
      result = result.filter((s) => matchesAny(multi.dmg, s.damageTypes));
    }
    if (multi.cond.length > 0) {
      result = result.filter((s) => matchesAny(multi.cond, s.conditions));
    }
    if (multi.atk.length > 0) {
      result = result.filter((s) => matchesAny(multi.atk, s.spellAttack));
    }
    if (multi.save.length > 0) {
      result = result.filter((s) => matchesAny(multi.save, s.savingThrows));
    }
    if (multi.time.length > 0) {
      result = result.filter((s) => matchesAny(multi.time, s.castTimeUnits));
    }
    if (multi.dur.length > 0) {
      result = result.filter((s) => multi.dur.includes(s.durationBucket));
    }
    if (multi.rng.length > 0) {
      result = result.filter((s) => multi.rng.includes(s.rangeBucket));
    }
    if (multi.area.length > 0) {
      result = result.filter((s) => matchesAny(multi.area, s.areaStyles));
    }
    if (multi.src.length > 0) {
      result = result.filter((s) =>
        entityMatchesSourceFilter(s, multi.src, catalog, bookNames),
      );
    }

    return result;
  }, [listSpells, appliedSearch, multi, catalog, bookNames]);

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
    const patch = {} as Partial<Record<MultiKey, string[]>>;
    for (const key of MULTI_KEYS) {
      patch[key] = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    }
    patchFilters(patch);
  }

  const filterValues = useMemo(() => {
    const values: ListFilterValues = {};
    for (const key of MULTI_KEYS) values[key] = multi[key];
    return values;
  }, [multi]);

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
