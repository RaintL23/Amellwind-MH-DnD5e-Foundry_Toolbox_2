import { useCallback, useState, type ReactNode } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { AbilityKey } from "@/shared/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  STANDARD_ARRAY,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  pointBuyRemaining,
  pointBuyTotalSpent,
  canRaisePointBuy,
  canLowerPointBuy,
  defaultPointBuyScores,
  rollSixAbilityScores,
  poolOptionsForAbility,
  assignFromPool,
  assignmentsToAbilityScores,
} from "../../utils/ability-scores";

const ABILITIES: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

type GenerationMethod = "manual" | "standard" | "pointbuy" | "dice";

function modifierFromScore(score: number): string {
  return formatModifier(Math.floor((score - 10) / 2));
}

const ABILITY_CARD_CLASS =
  "flex flex-col items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 transition-colors";

function AbilityStatCard({
  label,
  modifier,
  children,
}: {
  label: string;
  modifier: string;
  children: ReactNode;
}) {
  return (
    <div className={ABILITY_CARD_CLASS}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      <span className="text-[11px] text-muted-foreground">{modifier}</span>
    </div>
  );
}

function AbilityStatRow({
  label,
  modifier,
  children,
}: {
  label: string;
  modifier: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-foreground w-8">{label}</span>
      {children}
      <span className="text-xs font-medium text-primary min-w-[28px]">
        {modifier}
      </span>
    </div>
  );
}

export function AbilityScoresSection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { character, setAbilityScore, setAbilityScores } =
    useCharacterBuilder();
  const [method, setMethod] = useState<GenerationMethod>("manual");
  const [pool, setPool] = useState<number[]>([...STANDARD_ARRAY]);
  const [assignments, setAssignments] = useState<
    Partial<Record<AbilityKey, number>>
  >({});
  const [heroicRolls, setHeroicRolls] = useState(false);
  const [lastRolls, setLastRolls] = useState<number[] | null>(null);

  const syncAssignmentsToCharacter = useCallback(
    (next: Partial<Record<AbilityKey, number>>) => {
      const scores = assignmentsToAbilityScores(next);
      if (Object.keys(scores).length > 0) {
        setAbilityScores(scores);
      }
    },
    [setAbilityScores],
  );

  const initStandardArray = useCallback(() => {
    setPool([...STANDARD_ARRAY]);
    setAssignments({});
    setLastRolls(null);
    setAbilityScores(defaultPointBuyScores());
  }, [setAbilityScores]);

  const initPointBuy = useCallback(() => {
    setAbilityScores(defaultPointBuyScores());
    setAssignments({});
    setPool([]);
    setLastRolls(null);
  }, [setAbilityScores]);

  const handleMethodChange = (next: GenerationMethod) => {
    setMethod(next);
    if (next === "standard") initStandardArray();
    else if (next === "pointbuy") initPointBuy();
    else if (next === "dice") {
      setPool([]);
      setAssignments({});
      setLastRolls(null);
      setAbilityScores(defaultPointBuyScores());
    }
  };

  const handlePoolAssign = (key: AbilityKey, raw: string) => {
    const value = raw === "" ? null : parseInt(raw, 10);
    const { assignments: nextAssignments, pool: nextPool } = assignFromPool(
      key,
      value,
      assignments,
      pool,
    );
    setAssignments(nextAssignments);
    setPool(nextPool);
    syncAssignmentsToCharacter(nextAssignments);
  };

  const rollDice = () => {
    const rolled = rollSixAbilityScores(heroicRolls);
    setLastRolls(rolled);
    setPool([...rolled].sort((a, b) => b - a));
    setAssignments({});
    setAbilityScores(defaultPointBuyScores());
  };

  const adjustPointBuy = (key: AbilityKey, delta: number) => {
    const current = character.abilities[key];
    const next = current + delta;
    if (delta > 0 && !canRaisePointBuy(character.abilities, key)) return;
    if (delta < 0 && !canLowerPointBuy(character.abilities, key)) return;
    setAbilityScore(key, next);
  };

  const adjustManual = (key: AbilityKey, delta: number) => {
    const next = character.abilities[key] + delta;
    if (next < 1 || next > 30) return;
    setAbilityScore(key, next);
  };

  const pointsRemaining = pointBuyRemaining(character.abilities);
  const pointsSpent = pointBuyTotalSpent(character.abilities);
  const poolLabel = pool.length > 0 ? pool.join(", ") : "—";

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">
            Ability Scores
          </label>
          <Select
            value={method}
            onChange={(e) =>
              handleMethodChange(e.target.value as GenerationMethod)
            }
            className="h-8 text-xs"
          >
            <option value="manual">Manual</option>
            <option value="standard">
              Standard Array (15, 14, 13, 12, 10, 8)
            </option>
            <option value="pointbuy">Point Buy (27 pts, max 15)</option>
            <option value="dice">Roll Dice (4d6 drop lowest)</option>
          </Select>
        </div>
      )}

      {compact && (
        <Select
          value={method}
          onChange={(e) =>
            handleMethodChange(e.target.value as GenerationMethod)
          }
          className="mb-2 h-7 w-full text-[12px]"
        >
          <option value="manual">Manual</option>
          <option value="standard">
            Standard Array (15, 14, 13, 12, 10, 8)
          </option>
          <option value="pointbuy">Point buy</option>
          <option value="dice">Roll Dice (4d6 drop lowest)</option>
        </Select>
      )}

      {method === "standard" && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          Assign each value in the array to an ability. Available:{" "}
          <span className="font-medium text-foreground">{poolLabel}</span>
        </p>
      )}

      {method === "pointbuy" && (
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
            <span className="text-muted-foreground"> / {POINT_BUY_BUDGET}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={initPointBuy}
          >
            Reset (8 points)
          </Button>
        </div>
      )}

      {method === "dice" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={rollDice}
            >
              Roll 6× (4d6 drop lowest)
            </Button>
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={heroicRolls}
                onChange={(e) => setHeroicRolls(e.target.checked)}
                className="rounded border-border"
              />
              Heroic (re-roll 1s on 1s)
            </label>
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

      <div
        className={
          compact ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-2 gap-2"
        }
      >
        {ABILITIES.map(({ key, label }) => {
          const isPoolMethod = method === "standard" || method === "dice";
          const poolScore = assignments[key];
          const characterScore = character.abilities[key];
          const displayScore = isPoolMethod ? poolScore : characterScore;
          const modifier =
            displayScore !== undefined
              ? isPoolMethod
                ? modifierFromScore(displayScore)
                : formatModifier(character.getModifier(key))
              : "—";

          const poolSelect = (
            <Select
              value={assignments[key] ?? ""}
              onChange={(e) => handlePoolAssign(key, e.target.value)}
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
              <span
                className={
                  compact
                    ? "w-6 text-center text-xl font-medium text-foreground"
                    : "w-8 text-center text-sm font-semibold text-foreground"
                }
              >
                {characterScore}
              </span>
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
                <AbilityStatCard key={key} label={label} modifier={modifier}>
                  {manualControls}
                </AbilityStatCard>
              );
            }

            if (isPoolMethod) {
              return (
                <AbilityStatCard key={key} label={label} modifier={modifier}>
                  {poolSelect}
                </AbilityStatCard>
              );
            }

            return (
              <AbilityStatCard key={key} label={label} modifier={modifier}>
                {pointBuyControls}
              </AbilityStatCard>
            );
          }

          if (isPoolMethod) {
            return (
              <AbilityStatRow key={key} label={label} modifier={modifier}>
                {poolSelect}
              </AbilityStatRow>
            );
          }

          if (method === "pointbuy") {
            return (
              <AbilityStatRow key={key} label={label} modifier={modifier}>
                {pointBuyControls}
              </AbilityStatRow>
            );
          }

          return (
            <AbilityStatRow key={key} label={label} modifier={modifier}>
              <input
                type="number"
                min={1}
                max={30}
                value={characterScore}
                onChange={(e) =>
                  setAbilityScore(key, parseInt(e.target.value, 10) || 10)
                }
                className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </AbilityStatRow>
          );
        })}
      </div>

      {method === "pointbuy" && (
        <p className="text-[10px] text-muted-foreground">
          Spent: {pointsSpent}/{POINT_BUY_BUDGET}. Maximum {POINT_BUY_MAX}{" "}
          before origin bonuses.
        </p>
      )}
    </div>
  );
}
