import type { CookingRank } from "@/shared/types";
import { ItemRefText } from "@/shared/components/ItemRefText";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { RANK_COLORS } from "../constants/cooking.constants";
import type { MealRollResult } from "@/shared/types";

export function MealRollResultCard({
  result,
  rank,
  itemDescMap,
  onClose,
}: {
  result: MealRollResult;
  rank: CookingRank;
  itemDescMap: Record<string, string>;
  onClose: () => void;
}) {
  const colors = RANK_COLORS[rank];

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-5 mb-5 relative",
        colors.bg,
        colors.border,
      )}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
        aria-label="Cerrar resultado"
      >
        ×
      </button>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full border-2 shrink-0 font-bold text-lg",
            colors.bg,
            colors.border,
            colors.text,
          )}
        >
          {result.roll}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-muted-foreground">
              Roll {result.roll} →
            </span>
            <Badge variant={colors.badge}>Rank {rank}</Badge>
            <Badge variant={colors.badge}>DC {result.meal.dc}</Badge>
          </div>
          <h3 className={cn("font-bold text-xl mb-2", colors.text)}>
            {result.meal.name}
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            <ItemRefText text={result.meal.boon} itemDescMap={itemDescMap} />
          </p>
        </div>
      </div>
    </div>
  );
}
