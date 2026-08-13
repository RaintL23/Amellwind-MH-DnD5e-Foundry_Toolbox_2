import { useCallback, useEffect, useMemo, useState } from "react";
import type { Spell } from "@/shared/types";
import type {
  BuilderSpellSelection,
  BuilderSpellSelections,
} from "@/shared/types";
import type {
  SpellLevelSlot,
  BuilderPactSpellSlot,
  BuilderBonusCantripSlot,
} from "@/shared/types";
import type { SpellcastingInfo } from "@/features/raintdm/builder/hooks/useSpellcasting";
import {
  parseSpellLevel,
  isPactSpellSlot,
} from "@/features/raintdm/builder/hooks/useBuilderSlotSelection";
import {
  findCantripPoolBySlot,
  isBonusCantripSlot,
  BONUS_CANTRIP_POOL_BASE,
  countClassCantripSelections,
} from "@/features/raintdm/builder/utils/cantrip-pools.utils";
import { partitionSpellSelections } from "@/features/raintdm/builder/utils/species-spell-grants.utils";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import {
  grantsForSpellLevel,
  spellMatchesCharacterSpellList,
  spellMatchesFilterClass,
  spellNamesMatch,
  type SubclassSpellGrant,
} from "@/features/raintdm/builder/utils/subclass-spells.utils";
import {
  grantsForPactPool,
  PACT_SPELL_POOL_LEVEL,
} from "@/features/raintdm/builder/utils/pact-magic.utils";
import { spellToSelection } from "@/features/raintdm/builder/utils/spell-selection.utils";
import {
  resolveSpellGuideKey,
  slugifyRpgbotKey,
  sortByRpgbotRating,
  toRpgbotClassSlug,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/raintdm/builder/hooks/useRpgbotRatingsLookup";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import {
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";
import {
  ensureSpellUaSourcesLoaded,
  getListSpells,
  getSpellFilterSourceCodes,
} from "@/features/dnd/spells/services/spell.service";
import {
  buildSpellFacetFilterSections,
  collectSpellPresentFacets,
  spellMatchesFacetFilters,
} from "@/features/dnd/spells/utils/spell-list-filters";

function resolveGrantsAtLevel(
  grants: SubclassSpellGrant[],
  isPactPool: boolean,
  pactMaxLevel: number,
  spellLevel: number | null,
  spellLevelByName: Map<string, number>,
  allSpells: Spell[],
): SubclassSpellGrant[] {
  if (isPactPool) {
    return grantsForPactPool(grants, pactMaxLevel, spellLevelByName, allSpells);
  }
  return grantsForSpellLevel(grants, spellLevel!, spellLevelByName, allSpells);
}

export function useSpellLibraryPanelState({
  selectedSlot,
  className,
  characterLevel,
  spellcastingInfo,
  spellSelections,
  allSpells,
  spellLevelByName,
  onAddSpell,
}: {
  selectedSlot: SpellLevelSlot | BuilderPactSpellSlot | BuilderBonusCantripSlot;
  className: string;
  characterLevel: number;
  spellcastingInfo: SpellcastingInfo;
  spellSelections: BuilderSpellSelections;
  allSpells: Spell[];
  spellLevelByName: Map<string, number>;
  onAddSpell: (level: number, spell: BuilderSpellSelection) => void;
}) {
  const isPactPool = isPactSpellSlot(selectedSlot);
  const isBonusCantripPool =
    typeof selectedSlot === "string" && isBonusCantripSlot(selectedSlot);
  const activeBonusPool = isBonusCantripPool
    ? findCantripPoolBySlot(
        spellcastingInfo.bonusCantripPools,
        selectedSlot as BuilderBonusCantripSlot,
      )
    : undefined;
  const spellLevel =
    isPactPool || isBonusCantripPool ? null : parseSpellLevel(selectedSlot);
  const isClassCantrip = !isPactPool && !isBonusCantripPool && spellLevel === 0;
  const effectiveSpellLevel = isPactPool
    ? null
    : isBonusCantripPool || isClassCantrip
      ? 0
      : spellLevel;
  const selectionLevel = isPactPool
    ? PACT_SPELL_POOL_LEVEL
    : isBonusCantripPool
      ? (activeBonusPool?.selectionLevel ?? BONUS_CANTRIP_POOL_BASE)
      : spellLevel!;
  const [committedSearch, setCommittedSearch] = useState("");
  const [filterValues, setFilterValues] = useState<ListFilterValues>({});
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [spellPool, setSpellPool] = useState<Spell[]>(allSpells);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();
  const {
    searchDraft: search,
    setSearchDraft: setSearch,
    appliedSearch,
    commitSearch,
  } = useDebouncedListSearch(committedSearch, setCommittedSearch);

  useEffect(() => {
    commitSearch("");
    setFilterValues({});
  }, [selectedSlot, commitSearch]);

  useEffect(() => {
    setSpellPool(allSpells);
  }, [allSpells]);

  useEffect(() => {
    void getSpellFilterSourceCodes().then(setFilterSourceCodes);
  }, []);

  useEffect(() => {
    if (catalog.size === 0 || filterSourceCodes.length === 0) return;
    const defaults = defaultOfficialSourceCodes(filterSourceCodes, catalog);
    if (defaults.length === 0) return;
    setFilterValues((prev) => {
      const src = prev.src;
      const hasSrc = Array.isArray(src) ? src.length > 0 : !!src;
      if (hasSrc) return prev;
      return { ...prev, src: defaults };
    });
  }, [catalog, filterSourceCodes, selectedSlot]);

  useEffect(() => {
    const selectedSources = Array.isArray(filterValues.src)
      ? filterValues.src
      : typeof filterValues.src === "string" && filterValues.src
        ? [filterValues.src]
        : [];
    if (selectedSources.length === 0) return;

    let cancelled = false;
    void (async () => {
      await ensureSpellUaSourcesLoaded(selectedSources);
      if (cancelled) return;
      const list = await getListSpells();
      if (!cancelled) setSpellPool(list);
    })();

    return () => {
      cancelled = true;
    };
  }, [filterValues.src]);

  const selectedAtLevel = useMemo(
    () => (spellSelections ?? {})[selectionLevel] ?? [],
    [spellSelections, selectionLevel],
  );

  const { speciesLineage: speciesLineageAtLevel, chosen: chosenAtLevel } =
    useMemo(() => partitionSpellSelections(selectedAtLevel), [selectedAtLevel]);

  const selectedIds = useMemo(
    () => new Set(chosenAtLevel.map((s) => s.id)),
    [chosenAtLevel],
  );

  const classCantripsSelected = useMemo(
    () => countClassCantripSelections(chosenAtLevel),
    [chosenAtLevel],
  );

  const speciesGrantedCantripNames = useMemo(
    () =>
      new Set(
        speciesLineageAtLevel
          .filter((spell) => spell.level === 0)
          .map((spell) => spell.name.toLowerCase()),
      ),
    [speciesLineageAtLevel],
  );

  const atClassCantripCapacity =
    isClassCantrip && classCantripsSelected >= spellcastingInfo.cantripCount;
  const atBonusCantripCapacity =
    isBonusCantripPool &&
    !!activeBonusPool &&
    selectedAtLevel.length >= activeBonusPool.maxCount;
  const atCantripCapacity = atClassCantripCapacity || atBonusCantripCapacity;
  const isCantripSlot = isClassCantrip || isBonusCantripPool;
  const atSpellCapacity =
    !isCantripSlot &&
    !isPactPool &&
    spellcastingInfo.maxPreparedOrKnown > 0 &&
    spellcastingInfo.selectedSpellCount >= spellcastingInfo.maxPreparedOrKnown;

  const isAtCapacity = atCantripCapacity || atSpellCapacity;
  const q = appliedSearch.toLowerCase().trim();
  const pactMaxLevel = spellcastingInfo.pactMaxSpellLevel;

  const subclassSlug = useMemo(() => {
    const raw =
      spellcastingInfo.subclassShortName ?? spellcastingInfo.subclassName;
    return raw ? slugifyRpgbotKey(raw) : null;
  }, [spellcastingInfo.subclassName, spellcastingInfo.subclassShortName]);

  const rpgbotSpellContext = useMemo(() => {
    const classSlug = toRpgbotClassSlug(className);
    if (!classSlug) return null;
    return {
      classSlug,
      guideKey: resolveSpellGuideKey(classSlug, subclassSlug),
      category: "spell",
    };
  }, [className, subclassSlug]);

  const { lookup: rpgbotSpellLookup, ready: rpgbotSpellReady } =
    useRpgbotRatingsLookup(rpgbotSpellContext);

  const grantArgs = [
    isPactPool,
    pactMaxLevel,
    effectiveSpellLevel,
    spellLevelByName,
    spellPool,
  ] as const;

  const alwaysPreparedAtLevel = useMemo(
    () =>
      resolveGrantsAtLevel(
        spellcastingInfo.subclassAlwaysPrepared,
        ...grantArgs,
      ),
    [
      spellcastingInfo.subclassAlwaysPrepared,
      isPactPool,
      pactMaxLevel,
      spellLevel,
      spellLevelByName,
      spellPool,
    ],
  );

  const bonusKnownAtLevel = useMemo(
    () =>
      resolveGrantsAtLevel(spellcastingInfo.subclassBonusKnown, ...grantArgs),
    [
      spellcastingInfo.subclassBonusKnown,
      isPactPool,
      pactMaxLevel,
      spellLevel,
      spellLevelByName,
      spellPool,
    ],
  );

  const optionalFeatureAtLevel = useMemo(
    () =>
      resolveGrantsAtLevel(
        spellcastingInfo.optionalFeatureGranted,
        ...grantArgs,
      ),
    [
      spellcastingInfo.optionalFeatureGranted,
      isPactPool,
      pactMaxLevel,
      spellLevel,
      spellLevelByName,
      spellPool,
    ],
  );

  const subclassGrantsAtLevel = useMemo(
    () => [...alwaysPreparedAtLevel, ...bonusKnownAtLevel],
    [alwaysPreparedAtLevel, bonusKnownAtLevel],
  );

  const filterGrantBySearch = useCallback(
    (grant: SubclassSpellGrant) => !q || grant.name.toLowerCase().includes(q),
    [q],
  );

  const allSelectedCantripIds = useMemo(() => {
    const ids = new Set<string>();
    for (const spell of spellSelections[0] ?? []) ids.add(spell.id);
    for (const pool of spellcastingInfo.bonusCantripPools) {
      for (const spell of spellSelections[pool.selectionLevel] ?? []) {
        ids.add(spell.id);
      }
    }
    return ids;
  }, [spellSelections, spellcastingInfo.bonusCantripPools]);

  const spellListClassName = activeBonusPool?.spellListClassName ?? className;

  const spellListContext = useMemo(
    () => ({
      className: spellListClassName,
      subclassName: isBonusCantripPool ? null : spellcastingInfo.subclassName,
      subclassShortName: isBonusCantripPool
        ? null
        : spellcastingInfo.subclassShortName,
      expandedFilters: isBonusCantripPool
        ? []
        : spellcastingInfo.expandedSpellFilters,
      characterLevel,
      availableSpellSlotLevels: spellcastingInfo.availableSpellSlotLevels,
      selectedSpellLevel: isPactPool ? 0 : isBonusCantripPool ? 0 : spellLevel!,
      isPactPool,
      spellcastingFromSubclass: isBonusCantripPool
        ? false
        : spellcastingInfo.spellcastingFromSubclass,
    }),
    [
      spellListClassName,
      className,
      spellcastingInfo.subclassName,
      spellcastingInfo.subclassShortName,
      spellcastingInfo.expandedSpellFilters,
      spellcastingInfo.availableSpellSlotLevels,
      spellcastingInfo.spellcastingFromSubclass,
      characterLevel,
      isPactPool,
      isBonusCantripPool,
      spellLevel,
    ],
  );

  const spellMatchesClassList = useCallback(
    (spell: Spell) => {
      if (isBonusCantripPool) {
        return spellMatchesFilterClass(spell, spellListClassName);
      }
      return spellMatchesCharacterSpellList(spell, spellListContext);
    },
    [isBonusCantripPool, spellListClassName, spellListContext],
  );

  const slotEligibleSpells = useMemo(() => {
    if (isAtCapacity) return [];
    return spellPool.filter((s) => {
      if (isPactPool) {
        if (s.level < 1 || s.level > pactMaxLevel) return false;
      } else if (
        effectiveSpellLevel !== null &&
        s.level !== effectiveSpellLevel
      ) {
        return false;
      }
      if (!spellMatchesClassList(s)) return false;
      if (
        isClassCantrip &&
        speciesGrantedCantripNames.has(s.name.toLowerCase())
      ) {
        return false;
      }
      if (allSelectedCantripIds.has(s.id) && !selectedIds.has(s.id))
        return false;
      if (selectedIds.has(s.id)) return false;
      if (subclassGrantsAtLevel.some((g) => spellNamesMatch(s.name, g.name))) {
        return false;
      }
      if (optionalFeatureAtLevel.some((g) => spellNamesMatch(s.name, g.name))) {
        return false;
      }
      return true;
    });
  }, [
    spellPool,
    isPactPool,
    pactMaxLevel,
    effectiveSpellLevel,
    selectedIds,
    allSelectedCantripIds,
    subclassGrantsAtLevel,
    optionalFeatureAtLevel,
    spellMatchesClassList,
    isClassCantrip,
    speciesGrantedCantripNames,
    isAtCapacity,
  ]);

  const presentFacets = useMemo(
    () => collectSpellPresentFacets(slotEligibleSpells),
    [slotEligibleSpells],
  );

  const sourceSection = useMemo(
    () => buildSourcesFilterSection(filterSourceCodes, catalog, bookNames),
    [filterSourceCodes, catalog, bookNames],
  );

  const filterSections = useMemo(
    () =>
      buildSpellFacetFilterSections(presentFacets, {
        sourceSection,
      }),
    [presentFacets, sourceSection],
  );

  const availableSpells = useMemo(() => {
    const spells = slotEligibleSpells.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return spellMatchesFacetFilters(s, filterValues, {
        sourceMatcher: (spell, selected) =>
          entityMatchesSourceFilter(spell, selected, catalog, bookNames),
      });
    });

    return sortByRpgbotRating(
      spells,
      (s) =>
        rpgbotSpellReady
          ? (rpgbotSpellLookup?.(s.name, s.source) ?? null)
          : null,
      (s) => s.name,
    );
  }, [
    slotEligibleSpells,
    q,
    filterValues,
    catalog,
    bookNames,
    rpgbotSpellLookup,
    rpgbotSpellReady,
  ]);

  const handleSelect = useCallback(
    (spell: Spell) => {
      if (
        isClassCantrip &&
        classCantripsSelected >= spellcastingInfo.cantripCount
      ) {
        return;
      }
      onAddSpell(selectionLevel, spellToSelection(spell));
    },
    [
      onAddSpell,
      selectionLevel,
      isClassCantrip,
      classCantripsSelected,
      spellcastingInfo.cantripCount,
    ],
  );

  const levelLabel = isPactPool
    ? spellcastingInfo.isPreparedCaster
      ? `Prepared Spells (1–${pactMaxLevel})`
      : `Spells Known (1–${pactMaxLevel})`
    : isBonusCantripPool
      ? `${activeBonusPool?.label ?? "Bonus cantrips"} · ${spellListClassName}`
      : spellLevel === 0
        ? `Cantrips (${className})`
        : `Nivel ${spellLevel}`;

  const capacityHint = isClassCantrip
    ? `${classCantripsSelected}/${spellcastingInfo.cantripCount} class cantrips`
    : isBonusCantripPool && activeBonusPool
      ? `${selectedAtLevel.length}/${activeBonusPool.maxCount} · lista ${activeBonusPool.spellListClassName}`
      : isPactPool
        ? spellcastingInfo.maxPreparedOrKnown > 0
          ? `${spellcastingInfo.selectedSpellCount}/${spellcastingInfo.maxPreparedOrKnown} ${
              spellcastingInfo.isPreparedCaster
                ? "prepared"
                : "pact spells known"
            } · ${spellcastingInfo.pactSlotCount} slot${
              spellcastingInfo.pactSlotCount !== 1 ? "s" : ""
            } (niv. ${pactMaxLevel})`
          : null
        : spellcastingInfo.maxPreparedOrKnown > 0
          ? `${spellcastingInfo.selectedSpellCount}/${spellcastingInfo.maxPreparedOrKnown} ${spellcastingInfo.isPreparedCaster ? "prepared" : "known"}`
          : null;

  const disabledHint = isClassCantrip
    ? `Class cantrip limit reached (${spellcastingInfo.cantripCount})`
    : isBonusCantripPool && activeBonusPool
      ? `Bonus cantrip limit reached (${activeBonusPool.maxCount})`
      : isPactPool
        ? `Pact Magic prepared limit reached (${spellcastingInfo.maxPreparedOrKnown})`
        : spellcastingInfo.isPreparedCaster
          ? `Limit of preparation reached (${spellcastingInfo.maxPreparedOrKnown})`
          : `Limit of known spells reached (${spellcastingInfo.maxPreparedOrKnown})`;

  const selectedSectionLabel = isClassCantrip
    ? `Cantrips (${className})`
    : isBonusCantripPool
      ? (activeBonusPool?.label ?? "Bonus cantrips")
      : isPactPool
        ? spellcastingInfo.isPreparedCaster
          ? "Prepared Spells"
          : "Spells Known"
        : spellcastingInfo.isPreparedCaster
          ? "Prepared"
          : spellcastingInfo.isPactMagic
            ? "Pact spells known"
            : "Known";

  return {
    search,
    setSearch,
    filterValues,
    setFilterValues,
    filterSections,
    spellPool,
    selectionLevel,
    selectedAtLevel,
    chosenAtLevel,
    speciesLineageAtLevel,
    isAtCapacity,
    levelLabel,
    capacityHint,
    disabledHint,
    selectedSectionLabel,
    alwaysPreparedAtLevel,
    bonusKnownAtLevel,
    optionalFeatureAtLevel,
    filterGrantBySearch,
    availableSpells,
    handleSelect,
    rpgbotSpellLookup,
    rpgbotSpellReady,
  };
}
