import type { MealTable } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import { COOKING_RULES } from "../data/cooking.data";
import { RANK_COLORS } from "../constants/cooking.constants";
import type { CookingActiveTab } from "@/shared/types";

export function CookingRulesTab({
  mealTables,
  onSelectRank,
}: {
  mealTables: MealTable[];
  onSelectRank: (tab: CookingActiveTab) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {COOKING_RULES.map((rule) => (
          <div
            key={rule.name}
            className="rounded-lg border border-border bg-card p-4"
          >
            <h3 className="font-semibold text-foreground mb-2">{rule.name}</h3>
            <div className="space-y-1.5">
              {rule.content.map((line, i) => (
                <p
                  key={i}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  <DndRichText text={line} />
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-3">
          Meal Ranks at a Glance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mealTables.map((table) => {
            const colors = RANK_COLORS[table.rank];
            return (
              <div
                key={table.rank}
                onClick={() => onSelectRank(`rank${table.rank}`)}
                className={cn(
                  "rounded-md border p-3 cursor-pointer transition-colors hover:opacity-80",
                  colors.bg,
                  colors.border,
                )}
              >
                <Badge variant={colors.badge} className="mb-2">
                  Rank {table.rank}
                </Badge>
                <p className={cn("text-xs font-semibold", colors.text)}>
                  DC {table.meals[0]?.dc}+
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {table.levelRequirement}
                </p>
                <p className="text-xs text-muted-foreground">
                  {table.meals.length} meals
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
