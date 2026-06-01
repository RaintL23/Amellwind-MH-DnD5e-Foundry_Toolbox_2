import { useCallback, useState } from "react";
import { formatModifier } from "@/shared/utils/cr.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
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
} from "../utils/ability-scores";

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

export function AbilityScoresSection() {
  const { character, setAbilityScore, setAbilityScores } = useCharacterBuilder();
  const [method, setMethod] = useState<GenerationMethod>("manual");
  const [pool, setPool] = useState<number[]>([...STANDARD_ARRAY]);
  const [assignments, setAssignments] = useState<Partial<Record<AbilityKey, number>>>({});
  const [heroicRolls, setHeroicRolls] = useState(false);
  const [lastRolls, setLastRolls] = useState<number[] | null>(null);

  const syncAssignmentsToCharacter = useCallback(
    (next: Partial<Record<AbilityKey, number>>) => {
      const scores = assignmentsToAbilityScores(next);
      if (Object.keys(scores).length > 0) {
        setAbilityScores(scores);
      }
    },
    [setAbilityScores]
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
      pool
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

  const pointsRemaining = pointBuyRemaining(character.abilities);
  const pointsSpent = pointBuyTotalSpent(character.abilities);
  const poolLabel = pool.length > 0 ? pool.join(", ") : "—";

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">Ability Scores</label>
        <Select
          value={method}
          onChange={(e) => handleMethodChange(e.target.value as GenerationMethod)}
          className="h-8 text-xs"
        >
          <option value="manual">Manual</option>
          <option value="standard">Standard Array (15, 14, 13, 12, 10, 8)</option>
          <option value="pointbuy">Point Buy (27 pts, max 15)</option>
          <option value="dice">Roll Dice (4d6 drop lowest)</option>
        </Select>
      </div>

      {method === "standard" && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          Asigna cada valor del array a una característica. Disponibles:{" "}
          <span className="font-medium text-foreground">{poolLabel}</span>
        </p>
      )}

      {method === "pointbuy" && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">
            Puntos:{" "}
            <span
              className={
                pointsRemaining < 0 ? "text-destructive font-semibold" : "text-foreground font-medium"
              }
            >
              {pointsRemaining}
            </span>
            <span className="text-muted-foreground"> / {POINT_BUY_BUDGET}</span>
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={initPointBuy}>
            Reset (8)
          </Button>
        </div>
      )}

      {method === "dice" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={rollDice}>
              Roll 6× (4d6)
            </Button>
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={heroicRolls}
                onChange={(e) => setHeroicRolls(e.target.checked)}
                className="rounded border-border"
              />
              Heroic (re-roll 1s)
            </label>
          </div>
          {lastRolls && (
            <p className="text-[10px] text-muted-foreground">
              Resultados: {lastRolls.join(", ")} — sin asignar:{" "}
              <span className="font-medium text-foreground">{poolLabel}</span>
            </p>
          )}
          {!lastRolls && (
            <p className="text-[10px] text-muted-foreground">
              Lanza los dados y asigna cada resultado a una característica.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {ABILITIES.map(({ key, label }) => {
          const score =
            method === "standard" || method === "dice"
              ? assignments[key]
              : character.abilities[key];
          const modifier =
            score !== undefined ? modifierFromScore(score) : "—";

          if (method === "standard" || method === "dice") {
            const options = poolOptionsForAbility(key, assignments, pool);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground w-8">{label}</span>
                <Select
                  value={assignments[key] ?? ""}
                  onChange={(e) => handlePoolAssign(key, e.target.value)}
                  className="h-8 w-14 px-1 text-sm text-center"
                  disabled={method === "dice" && pool.length === 0 && assignments[key] === undefined}
                >
                  <option value="">—</option>
                  {options.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
                <span className="text-xs font-medium text-primary min-w-[28px]">{modifier}</span>
              </div>
            );
          }

          if (method === "pointbuy") {
            const value = character.abilities[key];
            return (
              <div key={key} className="flex items-center gap-1">
                <span className="text-xs font-bold text-foreground w-8">{label}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-xs shrink-0"
                  disabled={!canLowerPointBuy(character.abilities, key)}
                  onClick={() => adjustPointBuy(key, -1)}
                  aria-label={`Lower ${label}`}
                >
                  −
                </Button>
                <span className="w-8 text-center text-sm font-semibold text-foreground">{value}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-xs shrink-0"
                  disabled={!canRaisePointBuy(character.abilities, key)}
                  onClick={() => adjustPointBuy(key, 1)}
                  aria-label={`Raise ${label}`}
                >
                  +
                </Button>
                <span className="text-xs font-medium text-primary min-w-[28px]">
                  {formatModifier(character.getModifier(key))}
                </span>
              </div>
            );
          }

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground w-8">{label}</span>
              <input
                type="number"
                min={1}
                max={30}
                value={character.abilities[key]}
                onChange={(e) => setAbilityScore(key, parseInt(e.target.value) || 10)}
                className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs font-medium text-primary min-w-[28px]">
                {formatModifier(character.getModifier(key))}
              </span>
            </div>
          );
        })}
      </div>

      {method === "pointbuy" && (
        <p className="text-[10px] text-muted-foreground">
          Gastados: {pointsSpent}/{POINT_BUY_BUDGET}. Máximo {POINT_BUY_MAX} antes de bonificadores de origen.
        </p>
      )}
    </div>
  );
}
