import type { XgeTable, TableRow } from "../data/xanathar-tables.data";
import { LIFESTYLE_MODIFIERS } from "../data/xanathar-tables.data";

// ---------------------------------------------------------------------------
// Dice rolling primitives
// ---------------------------------------------------------------------------

/** Roll a single die with `sides` faces. Returns 1..sides. */
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** Roll `count` dice with `sides` faces each and sum the results. */
export function rollDice(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += rollDie(sides);
  }
  return total;
}

/**
 * Parse and evaluate a dice expression like "1d3", "1d4+1", "1d6+2", "1d8+3".
 * Returns the numeric result.
 */
export function evaluateDiceExpression(expr: string): number {
  const trimmed = expr.trim();
  const match = trimmed.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) return 0;
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const bonus = match[3] ? parseInt(match[3], 10) : 0;
  return rollDice(count, sides) + bonus;
}

// ---------------------------------------------------------------------------
// Row lookup
// ---------------------------------------------------------------------------

/** Find the row whose range contains `value`. */
export function findRow(table: XgeTable, value: number): TableRow | undefined {
  return table.rows.find((r) => value >= r.range[0] && value <= r.range[1]);
}

// ---------------------------------------------------------------------------
// Roll result type
// ---------------------------------------------------------------------------

export type RollResult = {
  tableId: string;
  tableName: string;
  /** Raw dice total before any modifiers */
  rawRoll: number;
  /** Final value used for row lookup (after modifiers) */
  finalValue: number;
  result: string;
  /** Additional sub-table id to optionally roll */
  subTableId?: string;
  /** For tables like Number of Siblings where the result itself is a dice formula */
  expandedResult?: string;
  /** True when the user picked a row manually instead of rolling */
  isManual?: boolean;
  /** Index of the manually selected row, for reliable highlighting */
  selectedRowIndex?: number;
  /** Parent table that triggered this roll (cascade / supplemental) */
  parentTableId?: string;
};

// ---------------------------------------------------------------------------
// Context passed to rolls that need external values
// ---------------------------------------------------------------------------

export type RollContext = {
  /** Charisma modifier for Childhood Memories */
  charismaModifier: number;
  /** Lifestyle modifier from the Family Lifestyle roll result */
  lifestyleModifier: number;
  /** Whether the character is a Dwarf or Elf (affects Siblings) */
  isDwarfOrElf: boolean;
};

// ---------------------------------------------------------------------------
// Main roll function
// ---------------------------------------------------------------------------

/**
 * Roll on a single table and return the structured result.
 * Applies all special rules defined in the XGE chapter.
 */
export function rollOnTable(table: XgeTable, ctx: RollContext): RollResult {
  const { count, sides, modifier } = table.dice;
  let rawRoll = rollDice(count, sides);
  let modValue = 0;

  // Resolve modifier
  if (modifier === "charisma") {
    modValue = ctx.charismaModifier;
  } else if (modifier === "lifestyle") {
    modValue = ctx.lifestyleModifier;
  } else if (typeof modifier === "number") {
    modValue = modifier;
  }

  // Special rule: Number of Siblings — subtract 2 for Dwarf/Elf
  if (table.id === "siblings-count" && ctx.isDwarfOrElf) {
    rawRoll = Math.max(1, rawRoll - 2);
  }

  const finalValue = rawRoll + modValue;
  const row = findRow(table, finalValue);
  const result = row?.result ?? "No result found";

  // Special rule: if the result is a dice expression (like "1d3"), expand it
  let expandedResult: string | undefined;
  if (table.resultIsDice && result !== "None" && /^\d+d\d+([+-]\d+)?$/.test(result.trim())) {
    const count = evaluateDiceExpression(result);
    expandedResult = `${count} sibling${count !== 1 ? "s" : ""}`;
  }

  return {
    tableId: table.id,
    tableName: table.name,
    rawRoll,
    finalValue,
    result,
    subTableId: row?.subTableId,
    expandedResult,
    isManual: false,
  };
}

/**
 * Manually select a specific row on a table (user click).
 * Skips dice rolling and uses the chosen outcome directly.
 */
export function selectRowOnTable(
  table: XgeTable,
  rowIndex: number,
): RollResult {
  const row = table.rows[rowIndex];
  if (!row) {
    throw new Error(`Invalid row index ${rowIndex} for table ${table.id}`);
  }

  const displayValue = row.range[0];

  let expandedResult: string | undefined;
  if (
    table.resultIsDice &&
    row.result !== "None" &&
    /^\d+d\d+([+-]\d+)?$/.test(row.result.trim())
  ) {
    const count = evaluateDiceExpression(row.result);
    expandedResult = `${count} sibling${count !== 1 ? "s" : ""}`;
  }

  return {
    tableId: table.id,
    tableName: table.name,
    rawRoll: displayValue,
    finalValue: displayValue,
    result: row.result,
    subTableId: row.subTableId,
    expandedResult,
    isManual: true,
    selectedRowIndex: rowIndex,
  };
}

// ---------------------------------------------------------------------------
// Life Events by Age helper
// ---------------------------------------------------------------------------

/**
 * Parse the "Life Events by Age" result to determine how many life events to roll.
 * Returns the number of life events (already rolled if a dice formula is involved).
 */
export function resolveLifeEventCount(ageResult: string): number {
  if (ageResult.includes("1 life event")) return 1;

  const diceMatch = ageResult.match(/roll (\d+)d(\d+) life events/);
  if (diceMatch) {
    const count = parseInt(diceMatch[1], 10);
    const sides = parseInt(diceMatch[2], 10);
    return rollDice(count, sides);
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Lifestyle modifier extractor
// ---------------------------------------------------------------------------

/** Extract the numeric lifestyle modifier from a Family Lifestyle roll result string. */
export function extractLifestyleModifier(resultText: string): number {
  return LIFESTYLE_MODIFIERS[resultText] ?? 0;
}

// ---------------------------------------------------------------------------
// Roll-All logic
// ---------------------------------------------------------------------------

/**
 * Ordered list of table IDs to roll for "Roll All" — respects dependencies:
 * 1. Family Lifestyle must be rolled before Childhood Home
 * 2. Life Events by Age must be rolled before Life Events
 * 3. Race-specific parent tables depend on selected race
 */
export const ROLL_ALL_ORDER = [
  // Origins
  "parents",
  "birthplace",
  "siblings-count",
  "birth-order",
  "family",
  "absent-parent",
  "family-lifestyle",
  "childhood-home",
  "childhood-memories",
  // Life Events
  "life-events-by-age",
  "life-events",
  // Supplemental
  "alignment",
  "cause-of-death",
  "occupation",
  "relationship",
  "status",
];

// Background and class tables are handled separately (filtered by selection).
