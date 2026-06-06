import { ClipboardList, RotateCcw } from "lucide-react";
import type { RollResult } from "../utils/xanathar-roll.utils";
import { XGE_SECTIONS } from "../data/xanathar-tables.data";

interface BackstorySummaryProps {
  results: Record<string, RollResult>;
  onReset: () => void;
}

/** Ordered list of all table ids as they appear in the sections */
function getOrderedResults(results: Record<string, RollResult>): RollResult[] {
  const ordered: RollResult[] = [];
  for (const section of XGE_SECTIONS) {
    for (const table of section.tables) {
      if (results[table.id]) {
        ordered.push(results[table.id]);
      }
    }
  }
  return ordered;
}

export function BackstorySummary({ results, onReset }: BackstorySummaryProps) {
  const ordered = getOrderedResults(results);
  const hasResults = ordered.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Backstory Summary</span>
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

      {/* Results list */}
      <div className="p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {!hasResults ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No rolls yet.</p>
            <p className="text-xs mt-1">Roll individual tables or use "Roll All".</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {ordered.map((r) => (
              <li key={r.tableId} className="text-xs">
                <span className="font-semibold text-primary block">{r.tableName}</span>
                <span className="text-foreground leading-snug">
                  {r.expandedResult
                    ? `${r.result} → ${r.expandedResult}`
                    : r.result}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Footer count */}
      {hasResults && (
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-right">
          {ordered.length} table{ordered.length !== 1 ? "s" : ""} rolled
        </div>
      )}
    </div>
  );
}
