import { useState, useCallback } from "react";
import { Meal, DailySkill, CookingRank } from "@/shared/types";
import {
  getAllMealTables,
  getAllDailySkills,
  rollRandomMeal,
  rollDailySkill,
} from "../services/cooking.service";
import { COOKING_RULES } from "../data/cooking.data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { Dices, ChefHat, BookOpen, Star } from "lucide-react";

type ActiveTab = "rules" | `rank${CookingRank}` | "daily";

const RANK_COLORS: Record<
  CookingRank,
  {
    badge: "blue" | "green" | "orange" | "red";
    bg: string;
    text: string;
    border: string;
  }
> = {
  1: {
    badge: "blue",
    bg: "bg-blue-900/20",
    text: "text-blue-300",
    border: "border-blue-700/40",
  },
  2: {
    badge: "green",
    bg: "bg-green-900/20",
    text: "text-green-300",
    border: "border-green-700/40",
  },
  3: {
    badge: "orange",
    bg: "bg-orange-900/20",
    text: "text-orange-300",
    border: "border-orange-700/40",
  },
  4: {
    badge: "red",
    bg: "bg-red-900/20",
    text: "text-red-300",
    border: "border-red-700/40",
  },
};

interface MealRollResult {
  meal: Meal;
  roll: number;
  total: number;
}

interface DailySkillRollResult {
  skill: DailySkill;
  d20: number;
  d6: number;
  total: number;
}

type RollResult = MealRollResult | DailySkillRollResult;

function isMealResult(r: RollResult): r is MealRollResult {
  return "meal" in r;
}

function DiceDisplay({ rolling }: { rolling: boolean }) {
  return (
    <Dices
      className={cn("h-6 w-6 transition-transform", rolling && "animate-spin")}
    />
  );
}

export function CookingPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("rules");
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [rolling, setRolling] = useState(false);

  const mealTables = getAllMealTables();
  const dailySkills = getAllDailySkills();

  const triggerRoll = useCallback((tab: ActiveTab) => {
    setRolling(true);
    setRollResult(null);
    setTimeout(() => {
      if (tab === "daily") {
        const result = rollDailySkill();
        setRollResult(result);
      } else if (tab.startsWith("rank")) {
        const rank = parseInt(tab.replace("rank", "")) as CookingRank;
        const { meal, roll } = rollRandomMeal(rank);
        setRollResult({ meal, roll, total: roll });
      }
      setRolling(false);
    }, 600);
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setRollResult(null);
  };

  const TABS: { id: ActiveTab; label: string; icon?: React.ReactNode }[] = [
    {
      id: "rules",
      label: "How to Cook",
      icon: <BookOpen className="h-3.5 w-3.5" />,
    },
    { id: "rank1", label: "Rank 1", icon: <Star className="h-3.5 w-3.5" /> },
    { id: "rank2", label: "Rank 2", icon: <Star className="h-3.5 w-3.5" /> },
    { id: "rank3", label: "Rank 3", icon: <Star className="h-3.5 w-3.5" /> },
    { id: "rank4", label: "Rank 4", icon: <Star className="h-3.5 w-3.5" /> },
    {
      id: "daily",
      label: "Daily Skills",
      icon: <Dices className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ChefHat className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Artisan Cooking System
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Craft meals that grant powerful boons to your hunting party.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {COOKING_RULES.map((rule) => (
              <div
                key={rule.name}
                className="rounded-lg border border-border bg-card p-4"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {rule.name}
                </h3>
                <div className="space-y-1.5">
                  {rule.content.map((line, i) => (
                    <p
                      key={i}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rank summary */}
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
                    onClick={() =>
                      handleTabChange(`rank${table.rank}` as ActiveTab)
                    }
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
      )}

      {/* Rank Meal Tables */}
      {(["rank1", "rank2", "rank3", "rank4"] as const).map((tabId) => {
        const rank = parseInt(tabId.replace("rank", "")) as CookingRank;
        const table = mealTables.find((t) => t.rank === rank);
        const colors = RANK_COLORS[rank];
        if (!table || activeTab !== tabId) return null;

        return (
          <div key={tabId}>
            {/* Roll panel */}
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
                  Available from {table.levelRequirement} · Cost:{" "}
                  {rank === 1
                    ? "1 sp"
                    : rank === 2
                      ? "1 gp"
                      : rank === 3
                        ? "5 gp"
                        : "10 gp"}{" "}
                  per serving
                </p>
                <p className="text-xs text-muted-foreground italic mt-1">
                  {table.footnote}
                </p>
              </div>
              <Button
                onClick={() => triggerRoll(tabId)}
                disabled={rolling}
                className="shrink-0 gap-2"
              >
                <DiceDisplay rolling={rolling} />
                Roll Random Meal
              </Button>
            </div>

            {/* Roll result */}
            {rollResult &&
              isMealResult(rollResult) &&
              rollResult.meal.rank === rank && (
                <RollResultCard
                  result={rollResult}
                  rank={rank}
                  colors={colors}
                  onClose={() => setRollResult(null)}
                />
              )}

            {/* Meals table */}
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
                      const isHighlighted =
                        rollResult &&
                        isMealResult(rollResult) &&
                        rollResult.meal.name === meal.name &&
                        rollResult.meal.rank === rank;
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
                            {meal.boon}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {/* Daily Skills Tab */}
      {activeTab === "daily" && (
        <div>
          {/* Roll panel */}
          <div className="rounded-lg border border-border bg-card p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">
                Daily Skills
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Roll 1d20 + 1d6 − 1 to determine your Felyne skill (result
                1–25).
              </p>
              <p className="text-xs text-muted-foreground italic mt-1">
                If the skill doesn't specify a duration, the effect lasts for 24
                hours, until you finish a long rest, or until you eat another
                meal.
              </p>
            </div>
            <Button
              onClick={() => triggerRoll("daily")}
              disabled={rolling}
              className="shrink-0 gap-2"
            >
              <DiceDisplay rolling={rolling} />
              Roll 1d20 + 1d6 − 1
            </Button>
          </div>

          {/* Daily skill roll result */}
          {rollResult && !isMealResult(rollResult) && (
            <DailySkillResultCard
              result={rollResult}
              onClose={() => setRollResult(null)}
            />
          )}

          {/* Daily skills list */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground w-14">
                      Roll
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Skill
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Effect
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySkills.map((skill) => {
                    const isHighlighted =
                      rollResult &&
                      !isMealResult(rollResult) &&
                      rollResult.skill.index === skill.index;
                    return (
                      <tr
                        key={skill.index}
                        className={cn(
                          "border-b border-border/50 transition-colors",
                          isHighlighted
                            ? "bg-primary/15 border-l-2 border-l-primary"
                            : "hover:bg-muted/30",
                        )}
                      >
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {skill.index}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {skill.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                          {skill.effect}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function RollResultCard({
  result,
  rank,
  colors,
  onClose,
}: {
  result: MealRollResult;
  rank: CookingRank;
  colors: (typeof RANK_COLORS)[CookingRank];
  onClose: () => void;
}) {
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
            {result.meal.boon}
          </p>
        </div>
      </div>
    </div>
  );
}

function DailySkillResultCard({
  result,
  onClose,
}: {
  result: DailySkillRollResult;
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-5 mb-5 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
        aria-label="Cerrar resultado"
      >
        ×
      </button>
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary/30 bg-primary/20 shrink-0 flex-col">
          <span className="text-xs text-muted-foreground leading-none">
            Roll
          </span>
          <span className="font-bold text-2xl text-primary leading-tight">
            {result.total}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-muted-foreground">
              d20({result.d20}) + d6({result.d6}) − 1 ={" "}
              <strong className="text-foreground">{result.total}</strong>
            </span>
          </div>
          <h3 className="font-bold text-xl text-primary mb-2">
            {result.skill.name}
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            {result.skill.effect}
          </p>
        </div>
      </div>
    </div>
  );
}
