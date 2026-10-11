import { formatModifier } from "@/shared/utils/cr.utils";
import { AbilityKey } from "@/shared/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canRaisePointBuy,
  canLowerPointBuy,
  poolOptionsForAbility,
} from "@/shared/utils/ability-scores";
import {
  effectiveModifier,
  formatBonusTooltip,
} from "../../../utils/species-ability-bonuses";
import { AbilityScoreValue } from "../AbilityScoreValue";
import { AbilityStatCard, AbilityStatRow } from "./AbilityStatLayouts";
import { HintTooltip } from "@/shared/components/HintTooltip";
import {
  ABILITIES,
  ABILITY_SHORT_DESCRIPTIONS,
  type GenerationMethod,
} from "./constants";
import type { useAbilityScoreBreakdowns } from "./useAbilityScoreBreakdowns";
import type { useAbilityGenerationState } from "./useAbilityGenerationState";

type AbilityScoreGridProps = {
  compact: boolean;
  method: GenerationMethod;
  pool: number[];
  assignments: Partial<Record<AbilityKey, number>>;
  character: ReturnType<typeof useAbilityGenerationState>["character"];
  setAbilityScore: ReturnType<typeof useAbilityGenerationState>["setAbilityScore"];
  getBreakdown: ReturnType<typeof useAbilityScoreBreakdowns>["getBreakdown"];
  handlePoolAssign: ReturnType<
    typeof useAbilityGenerationState
  >["handlePoolAssign"];
  adjustPointBuy: ReturnType<
    typeof useAbilityGenerationState
  >["adjustPointBuy"];
  adjustManual: ReturnType<typeof useAbilityGenerationState>["adjustManual"];
  /** Abilities the selected class relies on most (marked as "Key"). */
  keyAbilities: AbilityKey[];
};

export function AbilityScoreGrid({
  compact,
  method,
  pool,
  assignments,
  character,
  setAbilityScore,
  getBreakdown,
  handlePoolAssign,
  adjustPointBuy,
  adjustManual,
  keyAbilities,
}: AbilityScoreGridProps) {
  return (
    <div
      className={
        compact ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-2 gap-2"
      }
    >
      {ABILITIES.map(({ key, label }) => {
        const isPoolMethod = method === "standard" || method === "dice";
        const poolScore = assignments[key];
        const characterScore = character.abilities[key];
        const baseScore = isPoolMethod
          ? (poolScore ?? characterScore)
          : characterScore;
        const breakdown = getBreakdown(key, baseScore);
        const modifier =
          isPoolMethod && poolScore === undefined
            ? "—"
            : formatModifier(effectiveModifier(baseScore, breakdown.bonus));
        const layoutProps = {
          label,
          modifier,
          description: ABILITY_SHORT_DESCRIPTIONS[key],
          isKey: keyAbilities.includes(key),
        };

        const poolSelect = (
          <div className="flex items-center gap-1">
            <Select
              value={assignments[key] ?? ""}
              onChange={(e) => handlePoolAssign(key, e.target.value)}
              aria-label={`${label} score`}
              className={
                compact
                  ? "h-7 w-full max-w-[4.5rem] px-1 text-sm text-center"
                  : "h-8 w-14 px-1 text-sm text-center"
              }
              disabled={
                method === "dice" &&
                pool.length === 0 &&
                assignments[key] === undefined
              }
            >
              <option value="">—</option>
              {poolOptionsForAbility(key, assignments, pool).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            {poolScore !== undefined && (
              <HintTooltip
                content={formatBonusTooltip(breakdown)}
                className="max-w-[14rem] text-center"
              >
                <span className="cursor-help text-[10px] font-medium text-emerald-400">
                  → {breakdown.total}
                </span>
              </HintTooltip>
            )}
          </div>
        );

        const stepperControls = (
          canDecrease: boolean,
          canIncrease: boolean,
          onDecrease: () => void,
          onIncrease: () => void,
        ) => (
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`text-xs shrink-0 ${compact ? "h-6 w-6" : "h-7 w-7"}`}
              disabled={!canDecrease}
              onClick={onDecrease}
              aria-label={`Lower ${label}`}
            >
              −
            </Button>
            <AbilityScoreValue breakdown={breakdown} compact={compact} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`text-xs shrink-0 ${compact ? "h-6 w-6" : "h-7 w-7"}`}
              disabled={!canIncrease}
              onClick={onIncrease}
              aria-label={`Raise ${label}`}
            >
              +
            </Button>
          </div>
        );

        const manualControls = stepperControls(
          characterScore > 1,
          characterScore < 30,
          () => adjustManual(key, -1),
          () => adjustManual(key, 1),
        );

        const pointBuyControls = stepperControls(
          canLowerPointBuy(character.abilities, key),
          canRaisePointBuy(character.abilities, key),
          () => adjustPointBuy(key, -1),
          () => adjustPointBuy(key, 1),
        );

        if (compact) {
          if (method === "manual") {
            return (
              <AbilityStatCard key={key} {...layoutProps}>
                {manualControls}
              </AbilityStatCard>
            );
          }

          if (isPoolMethod) {
            return (
              <AbilityStatCard key={key} {...layoutProps}>
                {poolSelect}
              </AbilityStatCard>
            );
          }

          return (
            <AbilityStatCard key={key} {...layoutProps}>
              {pointBuyControls}
            </AbilityStatCard>
          );
        }

        if (isPoolMethod) {
          return (
            <AbilityStatRow key={key} {...layoutProps}>
              {poolSelect}
            </AbilityStatRow>
          );
        }

        if (method === "pointbuy") {
          return (
            <AbilityStatRow key={key} {...layoutProps}>
              {pointBuyControls}
            </AbilityStatRow>
          );
        }

        return (
          <AbilityStatRow key={key} {...layoutProps}>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                max={30}
                value={characterScore}
                onChange={(e) =>
                  setAbilityScore(key, parseInt(e.target.value, 10) || 10)
                }
                className="h-8 w-14 text-center"
                aria-label={`${label} score`}
              />
              {breakdown.bonus > 0 && (
                <HintTooltip
                  content={formatBonusTooltip(breakdown)}
                  className="max-w-[14rem] text-center"
                >
                  <span className="cursor-help text-[10px] font-medium text-emerald-400">
                    → {breakdown.total}
                  </span>
                </HintTooltip>
              )}
            </div>
          </AbilityStatRow>
        );
      })}
    </div>
  );
}
