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
  const hasBonus = breakdown.bonus > 0;
  const tooltip = formatBonusTooltip(breakdown);

  const valueClass = `inline-flex items-center justify-center text-center ${
    compact ? "w-6 text-xl font-medium" : "w-8 text-sm font-semibold"
  } ${hasBonus ? "text-emerald-400" : "text-foreground"}`;

  if (!hasBonus) {
    return <span className={valueClass}>{breakdown.total}</span>;
  }

  return (
    <HintTooltip content={tooltip} className="max-w-[14rem] text-center">
      <span className={`${valueClass} cursor-help`}>{breakdown.total}</span>
    </HintTooltip>
  );
}
