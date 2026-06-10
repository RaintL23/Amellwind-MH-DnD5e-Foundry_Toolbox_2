import type { MhCondition } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { AlertTriangle } from "lucide-react";

interface ConditionCardProps {
  condition: MhCondition;
  onClick: () => void;
}

export function ConditionCard({ condition, onClick }: ConditionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-border bg-card p-4 transition-all duration-200",
        "hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "hover:border-rose-500/40",
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-md p-2 shrink-0 bg-rose-950/60">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {condition.name}
          </h3>
          <span className="inline-block mt-1 rounded border border-rose-800/40 bg-rose-950/30 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
            Blight / Condition
          </span>
        </div>
      </div>

      {condition.summary && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {condition.summary}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
        <span>{condition.source}</span>
        {condition.page !== undefined && <span>p. {condition.page}</span>}
      </div>
    </button>
  );
}
