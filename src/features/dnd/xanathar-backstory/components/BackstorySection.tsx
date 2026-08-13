import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { XgeSection, XgeTable } from "../data/xanathar-tables.data";
import type { RollResult } from "../utils/xanathar-roll.utils";
import { BackstoryTableCard } from "./BackstoryTableCard";

interface BackstorySectionProps {
  section: XgeSection;
  visibleTables: XgeTable[];
  results: Record<string, RollResult>;
  allResults: Record<string, RollResult>;
  onRoll: (tableId: string) => void;
  onSelect: (tableId: string, rowIndex: number) => void;
  rollLockedIds: Set<string>;
  selectLockedIds: Set<string>;
  lockReasons: Record<string, string>;
  defaultOpen?: boolean;
}

function getCascadeChildResults(
  tableId: string,
  allResults: Record<string, RollResult>,
): RollResult[] {
  if (tableId === "siblings-count" || tableId === "birth-order") {
    return Object.keys(allResults)
      .filter((k) => k.startsWith("birth-order-"))
      .sort((a, b) => {
        const na = parseInt(a.replace("birth-order-", ""), 10);
        const nb = parseInt(b.replace("birth-order-", ""), 10);
        return na - nb;
      })
      .map((k) => allResults[k]);
  }

  if (tableId === "life-events-by-age" || tableId === "life-events") {
    return Object.keys(allResults)
      .filter((k) => k === "life-events" || /^life-events-\d+$/.test(k))
      .sort((a, b) => {
        const na = a === "life-events" ? 1 : parseInt(a.replace("life-events-", ""), 10);
        const nb = b === "life-events" ? 1 : parseInt(b.replace("life-events-", ""), 10);
        return na - nb;
      })
      .map((k) => allResults[k]);
  }

  return Object.keys(allResults)
    .filter((k) => k.startsWith(`${tableId}::`))
    .map((k) => allResults[k]);
}

export function BackstorySection({
  section,
  visibleTables,
  results,
  allResults,
  onRoll,
  onSelect,
  rollLockedIds,
  selectLockedIds,
  lockReasons,
  defaultOpen = false,
}: BackstorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const rolledCount = visibleTables.filter((t) => !!results[t.id]).length;
  const total = visibleTables.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/50",
        )}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-foreground">{section.name}</span>
          {section.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {section.description}
            </p>
          )}
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
            rolledCount === total && total > 0
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {rolledCount}/{total}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 px-5 pb-5">
            {visibleTables.map((table) => (
              <BackstoryTableCard
                key={table.id}
                table={table}
                result={results[table.id]}
                childResults={getCascadeChildResults(table.id, allResults)}
                onRoll={onRoll}
                onSelect={onSelect}
                rollDisabled={rollLockedIds.has(table.id)}
                selectDisabled={selectLockedIds.has(table.id)}
                disabledReason={lockReasons[table.id]}
              />
            ))}
            {visibleTables.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No tables available. Select a Background and Class in the setup bar above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
