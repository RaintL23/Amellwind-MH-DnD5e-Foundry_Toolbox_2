import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
} from "../../../utils/ability-scores";
import type { GenerationMethod } from "./constants";

type MethodHintPanelsProps = {
  method: GenerationMethod;
  poolLabel: string;
  pointsRemaining: number;
  pointsSpent: number;
  heroicRolls: boolean;
  lastRolls: number[] | null;
  onInitPointBuy: () => void;
  onRollDice: () => void;
  onHeroicRollsChange: (checked: boolean) => void;
  placement?: "before" | "after";
};

export function MethodHintPanels({
  method,
  poolLabel,
  pointsRemaining,
  pointsSpent,
  heroicRolls,
  lastRolls,
  onInitPointBuy,
  onRollDice,
  onHeroicRollsChange,
  placement = "before",
}: MethodHintPanelsProps) {
  if (placement === "after") {
    if (method !== "pointbuy") return null;
    return (
      <p className="text-[10px] text-muted-foreground">
        Spent: {pointsSpent}/{POINT_BUY_BUDGET}. Maximum {POINT_BUY_MAX}{" "}
        before origin bonuses.
      </p>
    );
  }

  return (
    <>
      {method === "standard" && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          Assign each value in the array to an ability. Available:{" "}
          <span className="font-medium text-foreground">{poolLabel}</span>
        </p>
      )}

      {method === "pointbuy" && (
        <>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              Points:{" "}
              <span
                className={
                  pointsRemaining < 0
                    ? "text-destructive font-semibold"
                    : "text-foreground font-medium"
                }
              >
                {pointsRemaining}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {POINT_BUY_BUDGET}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={onInitPointBuy}
            >
              Reset (8 points)
            </Button>
          </div>
        </>
      )}

      {method === "dice" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onRollDice}
            >
              Roll 6× (4d6 drop lowest)
            </Button>
            <div className="flex items-center gap-1">
              <Checkbox
                id="heroic-rolls"
                checked={heroicRolls}
                onCheckedChange={(c) => onHeroicRollsChange(c === true)}
              />
              <Label
                htmlFor="heroic-rolls"
                className="cursor-pointer text-[10px] font-normal text-muted-foreground"
              >
                Heroic (re-roll 1s on 1s)
              </Label>
            </div>
          </div>
          {lastRolls && (
            <p className="text-[10px] text-muted-foreground">
              Results: {lastRolls.join(", ")} — unassigned:{" "}
              <span className="font-medium text-foreground">{poolLabel}</span>
            </p>
          )}
          {!lastRolls && (
            <p className="text-[10px] text-muted-foreground">
              Roll the dice and assign each result to an ability.
            </p>
          )}
        </div>
      )}
    </>
  );
}
