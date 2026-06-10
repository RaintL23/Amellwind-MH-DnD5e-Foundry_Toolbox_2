import { useMemo } from "react";
import type { Class, ClassTableGroup, Subclass } from "@/shared/types";
import type { AbilityScores } from "@/shared/types";
import type { BuilderSpellSelections } from "@/shared/types";
import {
  resolveSubclassSpells,
  type ExpandedSpellFilter,
  type SubclassSpellGrant,
} from "../utils/subclass-spells.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpellcastingInfo {
  /** Whether the class can cast spells at all. */
  isSpellcaster: boolean;
  /** Spell levels the class has access to at the current character level (0 = cantrips). */
  availableSpellLevels: number[];
  /** Max cantrips known at the current level. */
  cantripCount: number;
  /** Total prepared or known spell count across all levels. */
  maxPreparedOrKnown: number;
  /** True for Wizard/Cleric/Druid/Paladin (formula-based preparation). */
  isPreparedCaster: boolean;
  /** Spellcasting ability label, e.g. "Intelligence". */
  spellcastingAbility: string | null;
  /** Total spells currently selected across all non-cantrip levels. */
  selectedSpellCount: number;
  /** Selected cantrips count. */
  selectedCantripCount: number;
  /** Spell slot levels available at the current character level (1–9). */
  availableSpellSlotLevels: number[];
  /** Subclass spells always prepared — do not count toward preparation limit. */
  subclassAlwaysPrepared: SubclassSpellGrant[];
  /** Subclass bonus known spells — do not count toward known limit. */
  subclassBonusKnown: SubclassSpellGrant[];
  /** Expanded spell list filters from subclass (e.g. Lore Bard, EK). */
  expandedSpellFilters: ExpandedSpellFilter[];
  subclassName: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ORDINAL_LEVEL: Record<string, number> = {
  "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5,
  "6th": 6, "7th": 7, "8th": 8, "9th": 9,
};

/**
 * Parses a value from a ClassTableGroup cell string to a number.
 * Returns 0 for "—" or unparseable values.
 */
function cellToNumber(val: string): number {
  if (!val || val === "—") return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Derives which spell slot levels are available from the class spell progression
 * table at a given character level. Returns an array of spell levels (1–9) that
 * have at least one slot available.
 */
function getAvailableSlotLevels(
  spellProgression: ClassTableGroup[],
  characterLevel: number,
): number[] {
  const rowIndex = characterLevel - 1;
  const levels: number[] = [];

  for (const group of spellProgression) {
    const labels = group.colLabels;
    const row = group.rows[rowIndex];
    if (!row || !labels) continue;

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      // Try to find ordinal labels like "1st", "2nd", etc.
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

/**
 * Parses the `preparedSpells` formula string (e.g. "<$level$> + <$int_mod$>")
 * and evaluates it given character level and ability scores.
 */
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

  // Remove any remaining template tags
  expr = expr.replace(/<\$[^$]+\$>/g, "0");

  // Safe-evaluate simple arithmetic: only digits, +, -, *, /, (, ), space
  if (!/^[0-9+\-*/ ().]+$/.test(expr)) return 0;

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${expr})`)() as number;
    return Math.max(1, Math.floor(result));
  } catch {
    return 0;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpellcasting(
  classData: Class | null,
  subclassData: Subclass | null,
  level: number,
  abilities: AbilityScores,
  spellSelections: BuilderSpellSelections = {},
): SpellcastingInfo {
  return useMemo((): SpellcastingInfo => {
    const none: SpellcastingInfo = {
      isSpellcaster: false,
      availableSpellLevels: [],
      cantripCount: 0,
      maxPreparedOrKnown: 0,
      isPreparedCaster: false,
      spellcastingAbility: null,
      selectedSpellCount: 0,
      selectedCantripCount: 0,
      availableSpellSlotLevels: [],
      subclassAlwaysPrepared: [],
      subclassBonusKnown: [],
      expandedSpellFilters: [],
      subclassName: null,
    };

    if (!classData?.casterProgression || classData.casterProgression === "none") {
      return none;
    }

    const rowIndex = level - 1;

    // ── Cantrip count ──────────────────────────────────────────────────────
    const cantripCount =
      classData.cantripProgression?.[rowIndex] ??
      getCantripCountFromTable(classData.spellProgression, rowIndex);

    // ── Available slot levels ─────────────────────────────────────────────
    const slotLevels = getAvailableSlotLevels(classData.spellProgression, level);

    // ── Subclass spell grants ─────────────────────────────────────────────
    const subclassSpells = resolveSubclassSpells(subclassData, level);

    // Build availableSpellLevels: cantrips first (if any), then slot levels
    const availableSpellLevels: number[] = [];
    if (cantripCount > 0) availableSpellLevels.push(0);
    availableSpellLevels.push(...slotLevels);

    if (availableSpellLevels.length === 0) return none;

    // ── Prepared vs Known ─────────────────────────────────────────────────
    const preparedFromTable = getPreparedSpellsFromTable(
      classData.spellProgression,
      rowIndex,
    );
    const isPreparedCaster =
      !!classData.preparedSpells ||
      (classData.preparedSpellsProgression?.length ?? 0) > 0 ||
      preparedFromTable > 0;

    let maxPreparedOrKnown = 0;
    if (isPreparedCaster) {
      if (classData.preparedSpells) {
        maxPreparedOrKnown = evaluatePreparedFormula(
          classData.preparedSpells,
          level,
          abilities,
        );
      } else if (classData.preparedSpellsProgression) {
        maxPreparedOrKnown =
          classData.preparedSpellsProgression[rowIndex] ?? preparedFromTable;
      } else {
        maxPreparedOrKnown = preparedFromTable;
      }
    } else if (classData.spellsKnownProgressionFixed) {
      maxPreparedOrKnown = classData.spellsKnownProgressionFixed[rowIndex] ?? 0;
    } else {
      // Fallback: try to read "Spells Known" column from progression table
      maxPreparedOrKnown = getSpellsKnownFromTable(
        classData.spellProgression,
        rowIndex,
      );
    }

    // ── Selected counts ────────────────────────────────────────────────────
    const selections = spellSelections ?? {};
    const selectedCantripCount = (selections[0] ?? []).length;
    const selectedSpellCount = Object.entries(selections)
      .filter(([lvl]) => Number(lvl) > 0)
      .reduce((sum, [, spells]) => sum + spells.length, 0);

    return {
      isSpellcaster: true,
      availableSpellLevels,
      cantripCount,
      maxPreparedOrKnown,
      isPreparedCaster,
      spellcastingAbility: classData.spellcastingAbility ?? null,
      selectedSpellCount,
      selectedCantripCount,
      availableSpellSlotLevels: slotLevels,
      subclassAlwaysPrepared: subclassSpells.alwaysPrepared,
      subclassBonusKnown: subclassSpells.bonusKnown,
      expandedSpellFilters: subclassSpells.expandedFilters,
      subclassName: subclassData?.name ?? null,
    };
  }, [classData, subclassData, level, abilities, spellSelections]);
}

// ─── Table-based fallbacks ────────────────────────────────────────────────────

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
