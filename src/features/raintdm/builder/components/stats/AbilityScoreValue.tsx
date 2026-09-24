import type { AbilityScoreBreakdown } from "../../utils/species-ability-bonuses";
import { formatBonusTooltip } from "../../utils/species-ability-bonuses";
import { HintTooltip } from "@/shared/components/HintTooltip";

export function AbilityScoreValue({
  breakdown,
  compact = false,
}: {
  breakdown: AbilityScoreBreakdown;
  compact?: boolean;
}) {
  const hasBonus = breakdown.bonus !== 0;
  const tooltip = formatBonusTooltip(breakdown);

  const valueClass = `inline-flex items-center justify-center text-center ${
    compact ? "min-w-[1.5rem] text-xl font-medium" : "min-w-[2rem] text-sm font-semibold"
  } ${hasBonus ? "text-emerald-400" : "text-foreground"}`;

  const display = hasBonus ? (
    <span className={`${valueClass} flex flex-col leading-none`}>
      <span className="text-[9px] font-normal text-muted-foreground">
        {breakdown.base}
      </span>
      <span>{breakdown.total}</span>
    </span>
  ) : (
    <span className={valueClass}>{breakdown.total}</span>
  );

  if (!hasBonus) {
    return display;
  }

  return (
    <HintTooltip content={tooltip} className="max-w-[14rem] text-center">
      <span className="cursor-help">{display}</span>
    </HintTooltip>
  );
}
