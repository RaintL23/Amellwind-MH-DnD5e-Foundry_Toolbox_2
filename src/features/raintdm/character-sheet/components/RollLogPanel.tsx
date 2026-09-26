import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { PlayRollEntry } from "../utils/play-character.types";
import { Badge } from "@/components/ui/badge";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

interface RollLogPanelProps {
  rolls: PlayRollEntry[];
  onClear?: () => void;
  emptyLabel?: string;
  className?: string;
  maxHeightClass?: string;
}

export const RollLogPanel = memo(function RollLogPanel({
  rolls,
  onClear,
  emptyLabel = "No rolls yet",
  className,
  maxHeightClass = "max-h-[70vh]",
}: RollLogPanelProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Roll log</h3>
        {onClear && rolls.length > 0 ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        ) : null}
      </div>
      <ul className={cn("space-y-1.5 overflow-y-auto text-xs", maxHeightClass)}>
        {rolls.map((r) => {
          const isCrit = r.natural === 20;
          const isFumble = r.natural === 1;
          return (
            <li
              key={r.id}
              className={cn(
                "rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5",
                isCrit && "border-emerald-500/40",
                isFumble && "border-destructive/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{r.label}</span>
                    {r.mode !== "normal" ? (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {r.mode === "advantage" ? "Adv" : "Dis"}
                      </Badge>
                    ) : null}
                    {isCrit ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/20 text-[9px] px-1 py-0 text-emerald-700 dark:text-emerald-300"
                      >
                        Nat 20
                      </Badge>
                    ) : null}
                    {isFumble ? (
                      <Badge
                        variant="secondary"
                        className="bg-destructive/20 text-[9px] px-1 py-0 text-destructive"
                      >
                        Nat 1
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{r.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={cn(
                      "text-base font-bold tabular-nums",
                      isCrit && "text-emerald-600 dark:text-emerald-400",
                      isFumble && "text-destructive",
                    )}
                  >
                    {r.total}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatTime(r.at)}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {rolls.length === 0 ? (
          <li className="py-4 text-center text-muted-foreground">
            {emptyLabel}
          </li>
        ) : null}
      </ul>
    </div>
  );
});
