import type { DailySkill } from "@/shared/types";
import { ItemRefText } from "@/shared/components/ItemRefText";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { CookingRollResult, DailySkillRollResult } from "@/shared/types";
import { isMealRollResult } from "@/shared/types";
import { DailySkillResultCard } from "./DailySkillResultCard";
import { DiceDisplay } from "./DiceDisplay";

export function CookingDailyTab({
  dailySkills,
  rollResult,
  rolling,
  itemDescMap,
  onRoll,
  onCloseResult,
}: {
  dailySkills: DailySkill[];
  rollResult: CookingRollResult | null;
  rolling: boolean;
  itemDescMap: Record<string, string>;
  onRoll: () => void;
  onCloseResult: () => void;
}) {
  const skillResult =
    rollResult && !isMealRollResult(rollResult) ? rollResult : null;

  return (
    <div>
      <div className="rounded-lg border border-border bg-card p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-bold text-lg text-foreground">Daily Skills</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Roll 1d20 + 1d6 − 1 to determine your Felyne skill (result 1–25).
          </p>
          <p className="text-xs text-muted-foreground italic mt-1">
            If the skill doesn't specify a duration, the effect lasts for 24
            hours, until you finish a long rest, or until you eat another meal.
          </p>
        </div>
        <Button
          onClick={onRoll}
          disabled={rolling}
          className="shrink-0 gap-2"
        >
          <DiceDisplay rolling={rolling} />
          Roll 1d20 + 1d6 − 1
        </Button>
      </div>

      {skillResult && (
        <DailySkillResultCard
          result={skillResult}
          itemDescMap={itemDescMap}
          onClose={onCloseResult}
        />
      )}

      <DailySkillsTable
        dailySkills={dailySkills}
        rollResult={rollResult}
        itemDescMap={itemDescMap}
      />
    </div>
  );
}

function DailySkillsTable({
  dailySkills,
  rollResult,
  itemDescMap,
}: {
  dailySkills: DailySkill[];
  rollResult: CookingRollResult | null;
  itemDescMap: Record<string, string>;
}) {
  return (
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
              const isHighlighted = isSkillHighlighted(rollResult, skill.index);
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
                    <ItemRefText
                      text={skill.effect}
                      itemDescMap={itemDescMap}
                    />
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

function isSkillHighlighted(
  rollResult: CookingRollResult | null,
  skillIndex: number,
): rollResult is DailySkillRollResult {
  return (
    rollResult !== null &&
    !isMealRollResult(rollResult) &&
    rollResult.skill.index === skillIndex
  );
}
