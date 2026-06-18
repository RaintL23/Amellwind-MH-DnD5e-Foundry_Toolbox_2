import { useMemo } from "react";
import type { BackgroundFaction, Class, ClassTableGroup, Subclass } from "@/shared/types";
import { resolveFactionExpandedSpellFilters } from "../data/faction-spells.data";
import type { AbilityScores } from "@/shared/types";
import type { BuilderSpellSelections, BuilderOptionalFeatureSelections } from "@/shared/types";
import {
  resolveSubclassSpells,
  type ExpandedSpellFilter,
  type SubclassSpellGrant,
} from "../utils/subclass-spells.utils";
import {
  getSpellcastingSectionLabel,
  isPactMagicClass,
} from "../utils/builder-class.utils";
import {
  getPactMagicProgression,
  pactPoolSelectedCount,
} from "../utils/pact-magic.utils";
import type { BuilderClassLevelEntry } from "../utils/multiclass.utils";
import type { CantripPoolDefinition } from "../utils/cantrip-pools.utils";
import { countClassCantripSelections } from "../utils/cantrip-pools.utils";
import {
  getMulticlassCasterLevel,
  getMulticlassSpellSlotLevels,
  hasMultipleSpellcastingClasses,
} from "../utils/multiclass.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CantripPoolInfo extends CantripPoolDefinition {
  selectedCount: number;
}

export interface SpellcastingInfo {
  /** Whether the class can cast spells at all. */
  isSpellcaster: boolean;
  /** Spell levels the class has access to at the current character level (0 = cantrips). */
  availableSpellLevels: number[];
  /** Max cantrips from class progression only (excludes feature/feat bonus pools). */
  cantripCount: number;
  /** Extra cantrip pools from features, feats, origin feats, etc. */
  bonusCantripPools: CantripPoolInfo[];
  /** Total prepared or known spell count across all non-cantrip levels. */
  maxPreparedOrKnown: number;
  /** True for Wizard/Cleric/Druid/Paladin (formula-based preparation). */
  isPreparedCaster: boolean;
  /** Spellcasting ability label, e.g. "Intelligence". */
  spellcastingAbility: string | null;
  /** UI label: "Pact Magic" (Warlock) or "Spellcasting". */
  sectionLabel: string;
  isPactMagic: boolean;
  /** Warlock: one prepared list for all spell levels up to pact slot level. */
  usesUnifiedPactPool: boolean;
  /** Max spell level choosable on the pact prepared list (also pact slot level). */
  pactMaxSpellLevel: number;
  /** Number of pact magic spell slots (all cast at pactMaxSpellLevel). */
  pactSlotCount: number;
  /** Total spells currently selected across all non-cantrip levels. */
  selectedSpellCount: number;
  /** Selected cantrips count. */
  selectedCantripCount: number;
  /** Class cantrips in slot 0 (excludes species lineage). */
  classCantripsSelected: number;
  /** Spell slot levels available at the current character level (1–9). */
  availableSpellSlotLevels: number[];
  /** Subclass spells always prepared — do not count toward preparation limit. */
  subclassAlwaysPrepared: SubclassSpellGrant[];
  /** Subclass bonus known spells — do not count toward known limit. */
  subclassBonusKnown: SubclassSpellGrant[];
  /** Spells granted by optional features (invocations, etc.). */
  optionalFeatureGranted: SubclassSpellGrant[];
  /** Expanded spell list filters from subclass (e.g. Lore Bard, EK). */
  expandedSpellFilters: ExpandedSpellFilter[];
  subclassName: string | null;
  subclassShortName: string | null;
  /** True when spell slots/progression come from a caster subclass (EK, AT, …). */
  spellcastingFromSubclass: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface EffectiveSpellcasting {
  casterProgression: string;
  spellProgression: ClassTableGroup[];
  cantripProgression?: number[];
  preparedSpells?: string;
  preparedSpellsProgression?: number[];
  spellsKnownProgressionFixed?: number[];
  spellcastingAbility: string | null;
  /** True when progression comes from a subclass (e.g. Eldritch Knight). */
  fromSubclass: boolean;
}

function resolveEffectiveSpellcasting(
  classData: Class,
  subclassData: Subclass | null,
): EffectiveSpellcasting | null {
  if (classData.casterProgression && classData.casterProgression !== "none") {
    return {
      casterProgression: classData.casterProgression,
      spellProgression: classData.spellProgression,
      cantripProgression: classData.cantripProgression,
      preparedSpells: classData.preparedSpells,
      preparedSpellsProgression: classData.preparedSpellsProgression,
      spellsKnownProgressionFixed: classData.spellsKnownProgressionFixed,
      spellcastingAbility: classData.spellcastingAbility ?? null,
      fromSubclass: false,
    };
  }

  if (
    subclassData?.casterProgression &&
    subclassData.casterProgression !== "none"
  ) {
    return {
      casterProgression: subclassData.casterProgression,
      spellProgression: subclassData.spellProgression ?? [],
      cantripProgression: subclassData.cantripProgression,
      preparedSpells: subclassData.preparedSpells,
      preparedSpellsProgression: subclassData.preparedSpellsProgression,
      spellsKnownProgressionFixed: subclassData.spellsKnownProgressionFixed,
      spellcastingAbility: subclassData.spellcastingAbility ?? null,
      fromSubclass: true,
    };
  }

  return null;
}

const ORDINAL_LEVEL: Record<string, number> = {
  "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5,
  "6th": 6, "7th": 7, "8th": 8, "9th": 9,
};

function cellToNumber(val: string): number {
  if (!val || val === "—") return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function getAvailableSlotLevels(
  spellProgression: ClassTableGroup[],
  characterLevel: number,
): number[] {
  const rowIndex = characterLevel - 1;
  const levels: number[] = [];

  for (const group of spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row || !labels) continue;

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (label.toLowerCase().includes("slot level")) continue;

      const matched = Object.entries(ORDINAL_LEVEL).find(([key]) =>
        label.toLowerCase().includes(key.toLowerCase()),
      );
      if (!matched) continue;
      const spellLevel = matched[1];
      const slots = cellToNumber(row[i] ?? "—");
      if (slots > 0 && !levels.includes(spellLevel)) {
        levels.push(spellLevel);
      }
    }
  }

  return levels.sort((a, b) => a - b);
}

function evaluatePreparedFormula(
  formula: string,
  level: number,
  abilities: AbilityScores,
): number {
  const getAbilityMod = (key: keyof AbilityScores): number =>
    Math.floor((abilities[key] - 10) / 2);

  let expr = formula
    .replace(/<\$level\$>/gi, String(level))
    .replace(/<\$int_mod\$>/gi, String(getAbilityMod("int")))
    .replace(/<\$wis_mod\$>/gi, String(getAbilityMod("wis")))
    .replace(/<\$cha_mod\$>/gi, String(getAbilityMod("cha")))
    .replace(/<\$str_mod\$>/gi, String(getAbilityMod("str")))
    .replace(/<\$dex_mod\$>/gi, String(getAbilityMod("dex")))
    .replace(/<\$con_mod\$>/gi, String(getAbilityMod("con")));

  expr = expr.replace(/<\$[^$]+\$>/g, "0");

  if (!/^[0-9+\-*/ ().]+$/.test(expr)) return 0;

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${expr})`)() as number;
    return Math.max(1, Math.floor(result));
  } catch {
    return 0;
  }
}

function getCantripCountFromTable(
  spellProgression: ClassTableGroup[],
  rowIndex: number,
): number {
  for (const group of spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;
    const idx = labels.findIndex((l) =>
      l.toLowerCase().includes("cantrip"),
    );
    if (idx !== -1) {
      return cellToNumber(row[idx] ?? "—");
    }
  }
  return 0;
}

function getPreparedSpellsFromTable(
  spellProgression: ClassTableGroup[],
  rowIndex: number,
): number {
  for (const group of spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;
    const idx = labels.findIndex((l) =>
      l.toLowerCase().includes("prepared spell"),
    );
    if (idx !== -1) {
      return cellToNumber(row[idx] ?? "—");
    }
  }
  return 0;
}

function getSpellsKnownFromTable(
  spellProgression: ClassTableGroup[],
  rowIndex: number,
): number {
  for (const group of spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;
    const idx = labels.findIndex((l) =>
      l.toLowerCase().includes("spells known"),
    );
    if (idx !== -1) {
      return cellToNumber(row[idx] ?? "—");
    }
  }
  return 0;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpellcasting(
  classData: Class | null,
  subclassData: Subclass | null,
  level: number,
  abilities: AbilityScores,
  spellSelections: BuilderSpellSelections = {},
  optionalFeatureSelections: BuilderOptionalFeatureSelections = {},
  optionalFeatureSpellGrants: SubclassSpellGrant[] = [],
  faction: BackgroundFaction | null = null,
  classLevelForProgression?: number,
  multiclassClassEntries?: BuilderClassLevelEntry[],
  bonusCantripPools: CantripPoolDefinition[] = [],
): SpellcastingInfo {
  return useMemo((): SpellcastingInfo => {
    const bonusPools: CantripPoolInfo[] = bonusCantripPools.map((pool) => ({
      ...pool,
      selectedCount: (spellSelections ?? {})[pool.selectionLevel]?.length ?? 0,
    }));
    const bonusCantripTotal = bonusPools.reduce(
      (sum, pool) => sum + pool.maxCount,
      0,
    );

    const none: SpellcastingInfo = {
      isSpellcaster: false,
      availableSpellLevels: [],
      cantripCount: 0,
      bonusCantripPools: [],
      maxPreparedOrKnown: 0,
      isPreparedCaster: false,
      spellcastingAbility: null,
      sectionLabel: "Spellcasting",
      isPactMagic: false,
      usesUnifiedPactPool: false,
      pactMaxSpellLevel: 0,
      pactSlotCount: 0,
      selectedSpellCount: 0,
      selectedCantripCount: 0,
      classCantripsSelected: 0,
      availableSpellSlotLevels: [],
      subclassAlwaysPrepared: [],
      subclassBonusKnown: [],
      optionalFeatureGranted: [],
      expandedSpellFilters: [],
      subclassName: null,
      subclassShortName: null,
      spellcastingFromSubclass: false,
    };

    if (!classData) return none;

    const effective = resolveEffectiveSpellcasting(classData, subclassData);
    if (!effective) return none;

    const progressionLevel = classLevelForProgression ?? level;
    const rowIndex = progressionLevel - 1;
    const selections = spellSelections ?? {};
    const isPactMagic =
      !effective.fromSubclass && isPactMagicClass(classData);
    const sectionLabel = getSpellcastingSectionLabel(classData);
    const subclassSpells = resolveSubclassSpells(subclassData, progressionLevel);
    const factionSpellFilters = resolveFactionExpandedSpellFilters(faction);
    const expandedSpellFilters = [
      ...subclassSpells.expandedFilters,
      ...factionSpellFilters,
    ];
    const {
      spellProgression,
      cantripProgression,
      preparedSpells,
      preparedSpellsProgression,
      spellsKnownProgressionFixed,
      spellcastingAbility,
    } = effective;

    if (isPactMagic) {
      const pact =
        getPactMagicProgression(spellProgression, rowIndex) ??
        ({
          cantripCount:
            cantripProgression?.[rowIndex] ??
            getCantripCountFromTable(spellProgression, rowIndex),
          preparedSpellCount:
            preparedSpellsProgression?.[rowIndex] ??
            spellsKnownProgressionFixed?.[rowIndex] ??
            (getPreparedSpellsFromTable(spellProgression, rowIndex) ||
              getSpellsKnownFromTable(spellProgression, rowIndex)),
          pactSlotCount: 0,
          pactSlotLevel: 0,
          usesPreparedSpells: !!preparedSpellsProgression?.length,
        } satisfies import("../utils/pact-magic.utils").PactMagicProgression);

      const cantripCount = pact.cantripCount;
      const maxPreparedOrKnown = pact.preparedSpellCount;
      const availableSpellLevels: number[] = [];
      if (cantripCount > 0 || bonusCantripTotal > 0) availableSpellLevels.push(0);

      if (
        cantripCount === 0 &&
        bonusCantripTotal === 0 &&
        maxPreparedOrKnown === 0 &&
        pact.pactSlotLevel === 0
      ) {
        return none;
      }

      const classCantripsSelected = countClassCantripSelections(selections[0]);
      const bonusCantripsSelected = bonusPools.reduce(
        (sum, pool) => sum + pool.selectedCount,
        0,
      );

      return {
        isSpellcaster: true,
        availableSpellLevels,
        cantripCount,
        bonusCantripPools: bonusPools,
        maxPreparedOrKnown,
        isPreparedCaster: pact.usesPreparedSpells,
        spellcastingAbility,
        sectionLabel,
        isPactMagic: true,
        usesUnifiedPactPool: true,
        pactMaxSpellLevel: pact.pactSlotLevel,
        pactSlotCount: pact.pactSlotCount,
        selectedSpellCount: pactPoolSelectedCount(selections),
        selectedCantripCount: classCantripsSelected + bonusCantripsSelected,
        classCantripsSelected,
        availableSpellSlotLevels:
          pact.pactSlotLevel > 0 ? [pact.pactSlotLevel] : [],
        subclassAlwaysPrepared: subclassSpells.alwaysPrepared,
        subclassBonusKnown: subclassSpells.bonusKnown,
        optionalFeatureGranted: optionalFeatureSpellGrants,
        expandedSpellFilters,
        subclassName: subclassData?.name ?? null,
        subclassShortName: subclassData?.shortName ?? null,
        spellcastingFromSubclass: effective.fromSubclass,
      };
    }

    const cantripCount =
      cantripProgression?.[rowIndex] ??
      getCantripCountFromTable(spellProgression, rowIndex);

    let slotLevels = getAvailableSlotLevels(spellProgression, progressionLevel);

    if (
      multiclassClassEntries &&
      hasMultipleSpellcastingClasses(multiclassClassEntries)
    ) {
      const casterLevel = getMulticlassCasterLevel(multiclassClassEntries);
      slotLevels = getMulticlassSpellSlotLevels(casterLevel);
    }

    const availableSpellLevels: number[] = [];
    if (cantripCount > 0 || bonusCantripTotal > 0) availableSpellLevels.push(0);
    availableSpellLevels.push(...slotLevels);

    if (availableSpellLevels.length === 0) return none;

    const preparedFromTable = getPreparedSpellsFromTable(
      spellProgression,
      rowIndex,
    );
    const isPreparedCaster =
      !!preparedSpells ||
      (preparedSpellsProgression?.length ?? 0) > 0 ||
      preparedFromTable > 0;

    let maxPreparedOrKnown = 0;
    if (isPreparedCaster) {
      if (preparedSpells) {
        maxPreparedOrKnown = evaluatePreparedFormula(
          preparedSpells,
          progressionLevel,
          abilities,
        );
      } else if (preparedSpellsProgression) {
        maxPreparedOrKnown =
          preparedSpellsProgression[rowIndex] ?? preparedFromTable;
      } else {
        maxPreparedOrKnown = preparedFromTable;
      }
    } else if (spellsKnownProgressionFixed) {
      maxPreparedOrKnown = spellsKnownProgressionFixed[rowIndex] ?? 0;
    } else {
      maxPreparedOrKnown = getSpellsKnownFromTable(spellProgression, rowIndex);
    }

    const classCantripsSelected = countClassCantripSelections(selections[0]);
    const bonusCantripsSelected = bonusPools.reduce(
      (sum, pool) => sum + pool.selectedCount,
      0,
    );
    const selectedSpellCount = Object.entries(selections)
      .filter(([lvl]) => Number(lvl) > 0)
      .reduce((sum, [, spells]) => sum + spells.length, 0);

    return {
      isSpellcaster: true,
      availableSpellLevels,
      cantripCount,
      bonusCantripPools: bonusPools,
      maxPreparedOrKnown,
      isPreparedCaster,
      spellcastingAbility,
      sectionLabel,
      isPactMagic: false,
      usesUnifiedPactPool: false,
      pactMaxSpellLevel: 0,
      pactSlotCount: 0,
      selectedSpellCount,
      selectedCantripCount: classCantripsSelected + bonusCantripsSelected,
      classCantripsSelected,
      availableSpellSlotLevels: slotLevels,
      subclassAlwaysPrepared: subclassSpells.alwaysPrepared,
      subclassBonusKnown: subclassSpells.bonusKnown,
      optionalFeatureGranted: optionalFeatureSpellGrants,
      expandedSpellFilters,
      subclassName: subclassData?.name ?? null,
      subclassShortName: subclassData?.shortName ?? null,
      spellcastingFromSubclass: effective.fromSubclass,
    };
  }, [
    classData,
    subclassData,
    level,
    classLevelForProgression,
    multiclassClassEntries,
    abilities,
    spellSelections,
    optionalFeatureSelections,
    optionalFeatureSpellGrants,
    faction,
    bonusCantripPools,
  ]);
}

export { PACT_SPELL_POOL_LEVEL } from "../utils/pact-magic.utils";