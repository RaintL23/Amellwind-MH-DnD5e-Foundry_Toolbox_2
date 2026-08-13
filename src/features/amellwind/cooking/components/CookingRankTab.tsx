import type { CookingRank, MealTable } from "@/shared/types";
import { ItemRefText } from "@/shared/components/ItemRefText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { RANK_COLORS, RANK_COST } from "../constants/cooking.constants";
import type {
  CookingActiveTab,
  CookingRollResult,
  MealRollResult,
} from "@/shared/types";
import { isMealRollResult } from "@/shared/types";
import { DiceDisplay } from "./DiceDisplay";
import { MealRollResultCard } from "./MealRollResultCard";

export function CookingRankTab({
  rank,
  table,
  rollResult,
  rolling,
  itemDescMap,
  onRoll,
  onCloseResult,
}: {
  rank: CookingRank;
  table: MealTable;
  rollResult: CookingRollResult | null;
  rolling: boolean;
  itemDescMap: Record<string, string>;
  onRoll: (tab: CookingActiveTab) => void;
  onCloseResult: () => void;
}) {
  const tabId = `rank${rank}` as CookingActiveTab;
  const colors = RANK_COLORS[rank];
  const mealResult =
    rollResult && isMealRollResult(rollResult) && rollResult.meal.rank === rank
      ? rollResult
      : null;

  return (
    <div>
      <div
        className={cn(
          "rounded-lg border p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4",
          colors.bg,
          colors.border,
        )}
      >
        <div className="flex-1">
          <h2 className={cn("font-bold text-lg", colors.text)}>
            Rank {rank} Meals
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Available from {table.levelRequirement} · Cost: {RANK_COST[rank]} per
            serving
          </p>
          <p className="text-xs text-muted-foreground italic mt-1">
            {table.footnote}
          </p>
        </div>
        <Button
          onClick={() => onRoll(tabId)}
          disabled={rolling}
          className="shrink-0 gap-2"
        >
          <DiceDisplay rolling={rolling} />
          Roll Random Meal
        </Button>
      </div>

      {mealResult && (
        <MealRollResultCard
          result={mealResult}
          rank={rank}
          itemDescMap={itemDescMap}
          onClose={onCloseResult}
        />
      )}

      <MealsTable
        table={table}
        rank={rank}
        colors={colors}
        rollResult={rollResult}
        itemDescMap={itemDescMap}
      />
    </div>
  );
}

function MealsTable({
  table,
  rank,
  colors,
  rollResult,
  itemDescMap,
}: {
  table: MealTable;
  rank: CookingRank;
  colors: (typeof RANK_COLORS)[CookingRank];
  rollResult: CookingRollResult | null;
  itemDescMap: Record<string, string>;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-8">
                #
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Meal Name
              </th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground w-16">
                DC
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Boon
              </th>
            </tr>
          </thead>
          <tbody>
            {table.meals.map((meal, i) => {
              const isHighlighted = isMealHighlighted(rollResult, meal.name, rank);
              return (
                <tr
                  key={meal.name}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    isHighlighted
                      ? cn(
                          colors.bg,
                          "border-l-2",
                          colors.border.replace("/40", ""),
                        )
                      : "hover:bg-muted/30",
                  )}
                >
                  <td className="px-4 py-3 text-muted-foreground/60 text-xs">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {meal.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={colors.badge}>{meal.dc}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    <ItemRefText text={meal.boon} itemDescMap={itemDescMap} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isMealHighlighted(
  rollResult: CookingRollResult | null,
  mealName: string,
  rank: CookingRank,
): rollResult is MealRollResult {
  return (
    rollResult !== null &&
    isMealRollResult(rollResult) &&
    rollResult.meal.name === mealName &&
    rollResult.meal.rank === rank
  );
}
