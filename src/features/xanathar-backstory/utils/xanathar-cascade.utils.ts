import { TABLE_BY_ID } from "../data/xanathar-tables.data";
import {
  rollOnTable,
  evaluateDiceExpression,
  resolveLifeEventCount,
  type RollContext,
  type RollResult,
} from "./xanathar-roll.utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SummaryNode = {
  result: RollResult;
  children: SummaryNode[];
};

/** Supplemental tables that chain into another table after rolling */
const SUPPLEMENTAL_CHAINS: Record<string, string> = {
  crime: "punishment",
};

/** Family results that imply a missing parent when parents are known */
const FAMILY_NEEDS_ABSENT_PARENT = new Set([
  "Single father or stepfather",
  "Single mother or stepmother",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function supplementalKey(parentId: string, subTableId: string): string {
  return `${parentId}::${subTableId}`;
}

/** Remove all results that descend from a parent table (children & supplemental). */
export function clearDescendants(
  results: Record<string, RollResult>,
  parentId: string,
): void {
  const toDelete: string[] = [];

  for (const key of Object.keys(results)) {
    const entry = results[key];
    if (key.startsWith(`${parentId}::`)) toDelete.push(key);
    if (entry?.parentTableId === parentId) toDelete.push(key);
    if (parentId === "siblings-count" && key.startsWith("birth-order-")) {
      toDelete.push(key);
    }
    if (
      parentId === "life-events-by-age" &&
      (key === "life-events" || /^life-events-\d+$/.test(key))
    ) {
      toDelete.push(key);
    }
  }

  for (const key of toDelete) {
    clearDescendants(results, key);
    delete results[key];
  }
}

/** Resolve how many siblings the character has from a siblings-count result. */
export function resolveSiblingCount(siblingsResult: RollResult): number {
  if (siblingsResult.result === "None") return 0;

  if (siblingsResult.expandedResult) {
    const match = siblingsResult.expandedResult.match(/^(\d+)/);
    if (match) return parseInt(match[1], 10);
  }

  const trimmed = siblingsResult.result.trim();
  if (/^\d+d\d+([+-]\d+)?$/.test(trimmed)) {
    return evaluateDiceExpression(trimmed);
  }

  return 0;
}

function knowsParents(results: Record<string, RollResult>): boolean {
  const parents = results["parents"];
  return !!parents && !parents.result.includes("do not know");
}

export function shouldAutoRollAbsentParent(results: Record<string, RollResult>): boolean {
  if (!knowsParents(results)) return false;
  const family = results["family"];
  if (!family) return false;
  return FAMILY_NEEDS_ABSENT_PARENT.has(family.result);
}

function rollTable(
  tableId: string,
  ctx: RollContext,
  overrides?: Partial<RollResult>,
): RollResult | undefined {
  const table = TABLE_BY_ID[tableId];
  if (!table) return undefined;
  return { ...rollOnTable(table, ctx), ...overrides };
}

function rollSupplemental(
  results: Record<string, RollResult>,
  parentId: string,
  subTableId: string,
  ctx: RollContext,
  parentName?: string,
): void {
  const key = supplementalKey(parentId, subTableId);
  const table = TABLE_BY_ID[subTableId];
  if (!table) return;

  const parentLabel = parentName ?? TABLE_BY_ID[parentId]?.name ?? parentId;
  const rolled = rollOnTable(table, ctx);
  results[key] = {
    ...rolled,
    tableId: key,
    tableName: table.name,
    parentTableId: parentId,
  };

  // Chain: crime → punishment
  const chained = SUPPLEMENTAL_CHAINS[subTableId];
  if (chained) {
    rollSupplemental(results, key, chained, ctx, table.name);
  }

  // Nested supplemental on the rolled result itself
  if (rolled.subTableId && rolled.subTableId !== subTableId) {
    rollSupplemental(results, key, rolled.subTableId, ctx, table.name);
  }
}

// ---------------------------------------------------------------------------
// Cascade handlers (run after a parent table is set/changed)
// ---------------------------------------------------------------------------

function cascadeSiblingsCount(
  results: Record<string, RollResult>,
  ctx: RollContext,
): void {
  clearDescendants(results, "siblings-count");

  const siblings = results["siblings-count"];
  if (!siblings) return;

  const count = resolveSiblingCount(siblings);
  const birthOrderTable = TABLE_BY_ID["birth-order"];
  if (!birthOrderTable || count === 0) return;

  for (let i = 1; i <= count; i++) {
    const key = `birth-order-${i}`;
    const rolled = rollOnTable(birthOrderTable, ctx);
    results[key] = {
      ...rolled,
      tableId: key,
      tableName: `Birth Order (Sibling ${i})`,
      parentTableId: "siblings-count",
    };
  }
}

function cascadeFamilyLifestyle(
  results: Record<string, RollResult>,
  ctx: RollContext,
): void {
  clearDescendants(results, "family-lifestyle");
  const rolled = rollTable("childhood-home", ctx, { parentTableId: "family-lifestyle" });
  if (rolled) results["childhood-home"] = rolled;
}

function cascadeFamily(
  results: Record<string, RollResult>,
  ctx: RollContext,
): void {
  clearDescendants(results, "family");

  if (!shouldAutoRollAbsentParent(results)) {
    delete results["absent-parent"];
    // Clear supplemental children of absent-parent
    for (const key of Object.keys(results)) {
      if (key.startsWith("absent-parent::")) delete results[key];
    }
    return;
  }

  const rolled = rollTable("absent-parent", ctx, { parentTableId: "family" });
  if (!rolled) return;
  results["absent-parent"] = rolled;
  if (rolled.subTableId) {
    rollSupplemental(results, "absent-parent", rolled.subTableId, ctx);
  }
}

function cascadeLifeEventsByAge(
  results: Record<string, RollResult>,
  ctx: RollContext,
): void {
  // Clear life event rolls (not life-events-by-age — that id also starts with "life-events-")
  clearDescendants(results, "life-events-by-age");

  const age = results["life-events-by-age"];
  if (!age) return;

  const lifeEventsTable = TABLE_BY_ID["life-events"];
  if (!lifeEventsTable) return;

  const count = resolveLifeEventCount(age.result);
  for (let i = 0; i < count; i++) {
    const key = i === 0 ? "life-events" : `life-events-${i + 1}`;
    const rolled = rollOnTable(lifeEventsTable, ctx);
    results[key] = {
      ...rolled,
      tableId: key,
      tableName: `Life Event ${i + 1}`,
      parentTableId: "life-events-by-age",
    };
    if (rolled.subTableId) {
      rollSupplemental(results, key, rolled.subTableId, ctx);
    }
  }
}

function cascadeSupplementalOnResult(
  results: Record<string, RollResult>,
  tableId: string,
  ctx: RollContext,
): void {
  const result = results[tableId];
  if (!result?.subTableId) return;

  // Clear previous supplemental children for this parent
  for (const key of Object.keys(results)) {
    if (key.startsWith(`${tableId}::`)) delete results[key];
  }

  rollSupplemental(results, tableId, result.subTableId, ctx);
}

// ---------------------------------------------------------------------------
// Main cascade entry point
// ---------------------------------------------------------------------------

/**
 * After setting a table result, cascade all dependent rolls in hierarchical order.
 * Clears stale descendants and re-rolls dependents when a parent value changes.
 */
export function cascadeDependents(
  results: Record<string, RollResult>,
  changedTableId: string,
  ctx: RollContext,
): void {
  switch (changedTableId) {
    case "siblings-count":
      cascadeSiblingsCount(results, ctx);
      break;
    case "family-lifestyle":
      cascadeFamilyLifestyle(results, ctx);
      break;
    case "family":
      cascadeFamily(results, ctx);
      break;
    case "life-events-by-age":
      cascadeLifeEventsByAge(results, ctx);
      break;
    default:
      break;
  }

  // Roll supplemental tables referenced by the changed result
  cascadeSupplementalOnResult(results, changedTableId, ctx);

  // parents change may affect whether absent-parent should exist
  if (changedTableId === "parents" && results["family"]) {
    cascadeFamily(results, ctx);
  }
}

// ---------------------------------------------------------------------------
// Summary tree builder
// ---------------------------------------------------------------------------

const ROOT_ORDER: string[] = [
  "parents",
  "parents-half-elf",
  "parents-half-orc",
  "parents-tiefling",
  "birthplace",
  "siblings-count",
  "family",
  "family-lifestyle",
  "childhood-memories",
];

function isRootResult(tableId: string): boolean {
  if (ROOT_ORDER.includes(tableId)) return true;
  if (tableId.startsWith("bg-") || tableId.startsWith("cls-")) return true;
  if (tableId === "life-events-by-age") return true;
  // Supplemental section roots (only if not a child)
  const supplementalRoots = [
    "alignment",
    "cause-of-death",
    "supp-class",
    "occupation",
    "race",
    "relationship",
    "status",
  ];
  return supplementalRoots.includes(tableId);
}

function collectChildren(
  parentId: string,
  results: Record<string, RollResult>,
): SummaryNode[] {
  const children: SummaryNode[] = [];

  if (parentId === "family-lifestyle" && results["childhood-home"]) {
    children.push({ result: results["childhood-home"], children: [] });
    return children;
  }

  if (parentId === "family" && results["absent-parent"]) {
    const node: SummaryNode = {
      result: results["absent-parent"],
      children: collectSupplementalChildren("absent-parent", results),
    };
    children.push(node);
    return children;
  }

  // birth-order-N children of siblings-count
  if (parentId === "siblings-count") {
    const birthOrders = Object.keys(results)
      .filter((k) => k.startsWith("birth-order-"))
      .sort((a, b) => {
        const na = parseInt(a.replace("birth-order-", ""), 10);
        const nb = parseInt(b.replace("birth-order-", ""), 10);
        return na - nb;
      });
    for (const key of birthOrders) {
      children.push({ result: results[key], children: [] });
    }
    return children;
  }

  // life-events-N children of life-events-by-age
  if (parentId === "life-events-by-age") {
    const lifeEvents = Object.keys(results)
      .filter((k) => k === "life-events" || /^life-events-\d+$/.test(k))
      .sort((a, b) => {
        const na = a === "life-events" ? 1 : parseInt(a.replace("life-events-", ""), 10);
        const nb = b === "life-events" ? 1 : parseInt(b.replace("life-events-", ""), 10);
        return na - nb;
      });
    for (const key of lifeEvents) {
      const node: SummaryNode = { result: results[key], children: [] };
      node.children = collectSupplementalChildren(key, results);
      children.push(node);
    }
    return children;
  }

  // supplemental children (parent::subtable)
  children.push(...collectSupplementalChildren(parentId, results));
  return children;
}

function collectSupplementalChildren(
  parentId: string,
  results: Record<string, RollResult>,
): SummaryNode[] {
  const prefix = `${parentId}::`;
  const directChildren = Object.keys(results).filter((k) => k.startsWith(prefix));

  return directChildren.map((key) => {
    const node: SummaryNode = { result: results[key], children: [] };
    node.children = collectSupplementalChildren(key, results);
    return node;
  });
}

/** Build an ordered summary tree with nested supplemental / dependent results. */
export function buildSummaryTree(
  results: Record<string, RollResult>,
): SummaryNode[] {
  const roots: SummaryNode[] = [];
  const used = new Set<string>();

  function addRoot(tableId: string) {
    const entry = results[tableId];
    if (!entry || used.has(tableId)) return;
    // Skip entries that appear nested under their parent in the tree
    if (entry.parentTableId && results[entry.parentTableId]) return;
    used.add(tableId);
    const node: SummaryNode = {
      result: results[tableId],
      children: collectChildren(tableId, results),
    };
    // Mark child keys as used so they don't appear as separate roots
    markUsed(node, used);
    roots.push(node);
  }

  // Origins + personal decisions in defined order
  for (const id of ROOT_ORDER) addRoot(id);

  // Background & class tables
  for (const key of Object.keys(results)) {
    if ((key.startsWith("bg-") || key.startsWith("cls-")) && !used.has(key)) {
      addRoot(key);
    }
  }

  // Life events by age
  addRoot("life-events-by-age");

  // Standalone supplemental rolls (not nested under another table)
  for (const key of Object.keys(results)) {
    const r = results[key];
    if (!r.parentTableId && !used.has(key) && !key.includes("::") && !key.startsWith("birth-order-") && !/^life-events-\d+$/.test(key) && key !== "life-events" && key !== "childhood-home" && key !== "absent-parent") {
      addRoot(key);
    }
  }

  return roots;
}

function markUsed(node: SummaryNode, used: Set<string>) {
  for (const child of node.children) {
    used.add(child.result.tableId);
    markUsed(child, used);
  }
}

/** Count total entries in the summary tree */
export function countSummaryNodes(nodes: SummaryNode[]): number {
  return nodes.reduce(
    (sum, n) => sum + 1 + countSummaryNodes(n.children),
    0,
  );
}

/** Tables locked from direct roll/select — auto-managed by cascade */
export function getCascadeLockState(
  results: Record<string, RollResult>,
): {
  rollLockedIds: Set<string>;
  selectLockedIds: Set<string>;
  reasons: Record<string, string>;
} {
  const rollLockedIds = new Set<string>();
  const selectLockedIds = new Set<string>();
  const reasons: Record<string, string> = {};

  if (!results["family-lifestyle"]) {
    rollLockedIds.add("childhood-home");
    selectLockedIds.add("childhood-home");
    reasons["childhood-home"] =
      "Roll Family Lifestyle first — Childhood Home rolls automatically after.";
  } else {
    rollLockedIds.add("childhood-home");
    reasons["childhood-home"] =
      "Auto-rolled from Family Lifestyle. Change Lifestyle to re-roll, or pick a row manually.";
  }

  if (!results["siblings-count"]) {
    rollLockedIds.add("birth-order");
    selectLockedIds.add("birth-order");
    reasons["birth-order"] =
      "Roll Number of Siblings first — Birth Order rolls automatically per sibling.";
  } else {
    rollLockedIds.add("birth-order");
    selectLockedIds.add("birth-order");
    reasons["birth-order"] =
      "Auto-rolled once per sibling. Change Number of Siblings to re-roll.";
  }

  if (!results["life-events-by-age"]) {
    rollLockedIds.add("life-events");
    selectLockedIds.add("life-events");
    reasons["life-events"] =
      "Roll Life Events by Age first — Life Events roll automatically after.";
  } else {
    rollLockedIds.add("life-events");
    selectLockedIds.add("life-events");
    reasons["life-events"] =
      "Auto-rolled from Life Events by Age. Change age to re-roll.";
  }

  if (shouldAutoRollAbsentParent(results)) {
    rollLockedIds.add("absent-parent");
    selectLockedIds.add("absent-parent");
    reasons["absent-parent"] =
      "Auto-rolled from Family result (single parent).";
  } else if (!results["family"]) {
    rollLockedIds.add("absent-parent");
    selectLockedIds.add("absent-parent");
    reasons["absent-parent"] = "Roll Family first.";
  }

  return { rollLockedIds, selectLockedIds, reasons };
}
