import type { AbilityScoreBreakdown } from "../../utils/species-ability-bonuses";
import { formatBonusTooltip } from "../../utils/species-ability-bonuses";

export function AbilityScoreValue({
  breakdown,
  compact = false,
}: {
  breakdown: AbilityScoreBreakdown;
  compact?: boolean;
}) {
  const hasBonus = breakdown.bonus > 0;
  const tooltip = formatBonusTooltip(breakdown);

  return (
    <span
      className={`relative group inline-flex items-center justify-center ${
        compact ? "w-6" : "w-8"
      }`}
    >
      <span
        className={
          compact
            ? `text-center text-xl font-medium ${
                hasBonus ? "text-emerald-400" : "text-foreground"
              }`
            : `text-center text-sm font-semibold ${
                hasBonus ? "text-emerald-400" : "text-foreground"
              }`
        }
        title={hasBonus ? tooltip : undefined}
      >
        {breakdown.total}
      </span>
      {hasBonus && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-[10px] leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 whitespace-pre-line text-center"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}
