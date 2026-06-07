import { TIER_BADGE_CLASS, TIER_SHORT_LABELS } from "../../constants/rune.constants";
import { cn } from "@/shared/utils/cn";

interface TierBadgeProps {
  tier: number;
  variant?: "compact" | "full";
}

export function TierBadge({ tier, variant = "compact" }: TierBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold",
        TIER_BADGE_CLASS[tier],
        variant === "full" && "px-2",
      )}
    >
      T{tier}
      {variant === "full" && ` · ${TIER_SHORT_LABELS[tier]}`}
    </span>
  );
}
