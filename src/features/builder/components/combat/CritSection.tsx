import { Target } from "lucide-react";
import { DamageBreakdown } from "@/shared/types";

export function CritSection({ breakdown }: { breakdown: DamageBreakdown }) {
  const { critRange, critRunes } = breakdown;
  const critPercent = ((21 - critRange) / 20) * 100;
  const hasExpansion = critRange < 20;
  const permanent = critRunes.filter((c) => !c.conditional);
  const conditional = critRunes.filter((c) => c.conditional);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Target className="h-3.5 w-3.5 shrink-0" />
          <span>
            Crit range:{" "}
            <span
              className={
                hasExpansion
                  ? "text-amber-400 font-semibold"
                  : "text-foreground font-medium"
              }
            >
              {critRange === 20 ? "20" : `${critRange}–20`}
            </span>
          </span>
        </div>
        <span
          className={`text-xs font-bold tabular-nums ${hasExpansion ? "text-amber-400" : "text-muted-foreground"}`}
        >
          {critPercent.toFixed(0)}%
        </span>
      </div>

      {permanent.map((c) => (
        <div
          key={`${c.name}-${c.monsterName}`}
          className="flex items-center gap-1.5 text-[10px] text-amber-400/80 pl-5"
        >
          <span className="shrink-0">+{c.rangeBonus} range</span>
          <span className="text-muted-foreground/60">—</span>
          <span className="truncate">{c.name}</span>
        </div>
      ))}

      {conditional.map((c) => (
        <div
          key={`${c.name}-${c.monsterName}`}
          className="flex items-start gap-1.5 text-[10px] text-blue-400/80 pl-5"
        >
          <span className="shrink-0 mt-0.5">⚡ 1st round</span>
          <span className="text-muted-foreground/60">—</span>
          <span className="leading-tight">
            {c.description} ({c.name})
          </span>
        </div>
      ))}
    </div>
  );
}
