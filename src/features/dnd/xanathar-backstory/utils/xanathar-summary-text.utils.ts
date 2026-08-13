import type { RollResult } from "./xanathar-roll.utils";
import {
  buildSummaryTree,
  countSummaryNodes,
  type SummaryNode,
} from "./xanathar-cascade.utils";

function formatResult(r: RollResult): string {
  if (r.expandedResult) return `${r.result} → ${r.expandedResult}`;
  return r.result;
}

function formatNode(node: SummaryNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  const line = `${indent}${node.result.tableName}: ${formatResult(node.result)}`;
  const childLines = node.children.map((child) => formatNode(child, depth + 1));
  return [line, ...childLines].join("\n");
}

/** Plain-text version of the Backstory Summary panel. */
export function formatBackstorySummaryText(
  results: Record<string, RollResult>,
): string {
  const tree = buildSummaryTree(results);
  if (countSummaryNodes(tree) === 0) return "";
  return tree.map((node) => formatNode(node)).join("\n");
}
