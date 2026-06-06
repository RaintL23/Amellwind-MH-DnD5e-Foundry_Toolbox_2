import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { XgeSection, XgeTable } from "../data/xanathar-tables.data";
import type { RollResult } from "../utils/xanathar-roll.utils";
import { BackstoryTableCard } from "./BackstoryTableCard";

interface BackstorySectionProps {
  section: XgeSection;
  /** Only the tables that should be visible (after race/bg/class filtering) */
  visibleTables: XgeTable[];
  results: Record<string, RollResult>;
  onRoll: (tableId: string) => void;
  /** Ids of tables that require a prior roll first */
  lockedTableIds: Set<string>;
  lockReasons: Record<string, string>;
  defaultOpen?: boolean;
}

export function BackstorySection({
  section,
  visibleTables,
  results,
  onRoll,
  lockedTableIds,
  lockReasons,
  defaultOpen = false,
}: BackstorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const rolledCount = visibleTables.filter((t) => !!results[t.id]).length;
  const total = visibleTables.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Section header */}
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

      {/* Tables */}
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
                onRoll={onRoll}
                disabled={lockedTableIds.has(table.id)}
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
