import { ClipboardList, RotateCcw } from "lucide-react";
import type { RollResult } from "../utils/xanathar-roll.utils";
import {
  buildSummaryTree,
  countSummaryNodes,
  type SummaryNode,
} from "../utils/xanathar-cascade.utils";

interface BackstorySummaryProps {
  results: Record<string, RollResult>;
  onReset: () => void;
}

function formatResult(r: RollResult): string {
  if (r.expandedResult) return `${r.result} → ${r.expandedResult}`;
  return r.result;
}

function SummaryEntry({
  node,
  depth = 0,
}: {
  node: SummaryNode;
  depth?: number;
}) {
  const { result, children } = node;
  const isNested = depth > 0;

  return (
    <li className={isNested ? "ml-3 border-l border-border pl-2" : ""}>
      <span
        className={
          isNested
            ? "font-medium text-muted-foreground block text-[12px]"
            : "font-semibold text-primary block text-xs"
        }
      >
        {result.tableName}
      </span>
      <span className="text-[14px] text-foreground leading-snug">
        {formatResult(result)}
      </span>
      {children.length > 0 && (
        <ol className="flex flex-col gap-1.5 mt-1.5">
          {children.map((child) => (
            <SummaryEntry
              key={child.result.tableId}
              node={child}
              depth={depth + 1}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

export function BackstorySummary({ results, onReset }: BackstorySummaryProps) {
  const tree = buildSummaryTree(results);
  const totalCount = countSummaryNodes(tree);
  const hasResults = totalCount > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden sticky top-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm text-foreground">
            Backstory Summary
          </span>
        </div>
        {hasResults && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {!hasResults ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No rolls yet.</p>
            <p className="text-xs mt-1">
              Roll individual tables or use &quot;Roll All&quot;.
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-1.5 text-xs">
            {tree.map((node) => (
              <SummaryEntry key={node.result.tableId} node={node} />
            ))}
          </ol>
        )}
      </div>

      {hasResults && (
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-right">
          {totalCount} result{totalCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
