import type { ReactNode } from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { LibraryProficiencySummaryRow } from "@/features/raintdm/builder/utils/library-proficiency-highlight.utils";

/** Compact badge marking a trait/feature/paragraph that grants proficiency. */
export function ProficiencyGrantBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-500/50 bg-amber-500/10 text-[9px] font-semibold uppercase tracking-wide text-amber-300",
        className,
      )}
    >
      Proficiency
    </Badge>
  );
}

/** Summary card of structured proficiency grants for Library detail panes. */
export function LibraryProficiencySummary({
  rows,
  className,
}: {
  rows: LibraryProficiencySummaryRow[];
  className?: string;
}) {
  if (!rows.length) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1.5",
        className,
      )}
    >
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
        <Wrench className="h-3 w-3" aria-hidden />
        Proficiencies granted
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {row.label}
            </p>
            <p className="text-xs font-medium leading-relaxed text-foreground">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Soft highlight wrapper for description blocks that grant proficiency. */
export function ProficiencyHighlightFrame({
  active,
  children,
  className,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!active) return <>{children}</>;

  return (
    <div
      className={cn(
        "rounded-md border border-amber-500/35 bg-amber-500/5 px-2 py-1.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
