import { useCallback, useEffect, useMemo, useState } from "react";
import type { Spell } from "@/shared/types";
import type {
  BuilderSpellSelection,
  BuilderSpellSelections,
} from "@/shared/types";
import type { SpellLevelSlot, BuilderPactSpellSlot, BuilderBonusCantripSlot } from "@/shared/types";
import type { SpellcastingInfo } from "@/features/builder/hooks/useSpellcasting";
import { parseSpellLevel, isPactSpellSlot } from "@/features/builder/hooks/useBuilderSlotSelection";
import {
  findCantripPoolBySlot,
  isBonusCantripSlot,
} from "@/features/builder/utils/cantrip-pools.utils";
import {
  grantsForSpellLevel,
  spellMatchesCharacterSpellList,
  spellNamesMatch,
  spellOnBaseClassList,
  type SubclassSpellGrant,
} from "@/features/builder/utils/subclass-spells.utils";
import {
  grantsForPactPool,
  PACT_SPELL_POOL_LEVEL,
} from "@/features/builder/utils/pact-magic.utils";
import { spellToSelection } from "@/features/builder/utils/spell-selection.utils";
import {
  resolveSpellGuideKey,
  slugifyRpgbotKey,
  sortByRpgbotRating,
  toRpgbotClassSlug,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/builder/hooks/useRpgbotRatingsLookup";

function resolveGrantsAtLevel(
  grants: SubclassSpellGrant[],
  isPactPool: boolean,
  pactMaxLevel: number,
  spellLevel: number | null,
  spellLevelByName: Map<string, number>,
  allSpells: Spell[],
): SubclassSpellGrant[] {
  if (isPactPool) {
    return grantsForPactPool(
      grants,
      pactMaxLevel,
      spellLevelByName,
      allSpells,
    );
  }
  return grantsForSpellLevel(
    grants,
    spellLevel!,
    spellLevelByName,
    allSpells,
  );
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
  const spellLevel = isPactPool || isBonusCantripPool
    ? null
    : parseSpellLevel(selectedSlot);
  const selectionLevel = isPactPool
    ? PACT_SPELL_POOL_LEVEL
    : isBonusCantripPool
      ? activeBonusPool?.selectionLevel ?? 0
      : spellLevel!;
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [selectedSlot]);

  const selectedAtLevel = useMemo(
    () => (spellSelections ?? {})[selectionLevel] ?? [],
    [spellSelections, selectionLevel],
  );

  const selectedIds = useMemo(
    () => new Set(selectedAtLevel.map((s) => s.id)),
    [selectedAtLevel],
  );

  const isClassCantrip = !isPactPool && !isBonusCantripPool && spellLevel === 0;
  const atClassCantripCapacity =
    isClassCantrip &&
    selectedAtLevel.length >= spellcastingInfo.cantripCount;
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
  const q = search.toLowerCase().trim();
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
    spellLevel,
    spellLevelByName,
    allSpells,
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
      allSpells,
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
      allSpells,
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
      allSpells,
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

  const spellListClassName =
    activeBonusPool?.spellListClassName ?? className;

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
        return spellOnBaseClassList(spell, spellListClassName);
      }
      return spellMatchesCharacterSpellList(spell, spellListContext);
    },
    [isBonusCantripPool, spellListClassName, spellListContext],
  );

  const availableSpells = useMemo(() => {
    if (isAtCapacity) return [];
    const spells = allSpells.filter((s) => {
      if (isPactPool) {
        if (s.level < 1 || s.level > pactMaxLevel) return false;
      } else if (s.level !== spellLevel) {
        return false;
      }
      if (!spellMatchesClassList(s)) return false;
      if (allSelectedCantripIds.has(s.id) && !selectedIds.has(s.id)) return false;
      if (selectedIds.has(s.id)) return false;
      if (subclassGrantsAtLevel.some((g) => spellNamesMatch(s.name, g.name))) {
        return false;
      }
      if (optionalFeatureAtLevel.some((g) => spellNamesMatch(s.name, g.name))) {
        return false;
      }
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
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
    allSpells,
    isPactPool,
    pactMaxLevel,
    spellLevel,
    selectedIds,
    allSelectedCantripIds,
    subclassGrantsAtLevel,
    optionalFeatureAtLevel,
    q,
    spellMatchesClassList,
    isAtCapacity,
    rpgbotSpellLookup,
    rpgbotSpellReady,
  ]);

  const handleSelect = useCallback(
    (spell: Spell) => {
      onAddSpell(selectionLevel, spellToSelection(spell));
    },
    [onAddSpell, selectionLevel],
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
    ? `${selectedAtLevel.length}/${spellcastingInfo.cantripCount} cantrips de clase`
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
    ? `Límite de cantrips de clase (${spellcastingInfo.cantripCount})`
    : isBonusCantripPool && activeBonusPool
      ? `Límite alcanzado (${activeBonusPool.maxCount})`
    : isPactPool
      ? `Pact Magic prepared limit reached (${spellcastingInfo.maxPreparedOrKnown})`
      : spellcastingInfo.isPreparedCaster
        ? `Limit of preparation reached (${spellcastingInfo.maxPreparedOrKnown})`
        : `Limit of known spells reached (${spellcastingInfo.maxPreparedOrKnown})`;

  const selectedSectionLabel = isClassCantrip
    ? `Cantrips (${className})`
    : isBonusCantripPool
      ? activeBonusPool?.label ?? "Bonus cantrips"
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
    selectionLevel,
    selectedAtLevel,
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
