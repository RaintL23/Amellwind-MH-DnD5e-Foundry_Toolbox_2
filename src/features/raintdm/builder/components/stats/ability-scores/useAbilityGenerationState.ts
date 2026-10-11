import { useCallback, useEffect, useRef, useState } from "react";
import type { AbilityKey, AbilityScores } from "@/shared/types";
import { useCharacterBuilder } from "../../../context/CharacterBuilderContext";
import {
  ABILITY_KEYS,
  STANDARD_ARRAY,
  pointBuyRemaining,
  pointBuyTotalSpent,
  canRaisePointBuy,
  canLowerPointBuy,
  defaultPointBuyScores,
  rollSixAbilityScores,
  assignFromPool,
  poolAssignmentsToScores,
  poolStateFromScores,
} from "@/shared/utils/ability-scores";
import { assignValuesByPriority } from "../../../utils/randomizer/ability-randomizer.utils";
import type { GenerationMethod } from "./constants";

export function useAbilityGenerationState() {
  const {
    character,
    setAbilityScore,
    setAbilityScores,
    abilityScoreMethod: method,
    setAbilityScoreMethod,
  } = useCharacterBuilder();
  const [pool, setPool] = useState<number[]>([...STANDARD_ARRAY]);
  const [assignments, setAssignments] = useState<
    Partial<Record<AbilityKey, number>>
  >({});
  const [heroicRolls, setHeroicRolls] = useState(false);
  const [lastRolls, setLastRolls] = useState<number[] | null>(null);

  useEffect(() => {
    if (method !== "pointbuy") return;
    setPool([]);
    setAssignments({});
    setLastRolls(null);
  }, [method]);

  // Scores changed outside this hook (import, autosave, randomizer, remount):
  // rebuild the pool picks so the selects reflect the restored build.
  const resyncedFrom = useRef<AbilityScores | null>(null);
  useEffect(() => {
    if (method !== "standard" && method !== "dice") return;
    if (resyncedFrom.current === character.abilities) return;
    const expected = poolAssignmentsToScores(assignments);
    if (ABILITY_KEYS.every((k) => expected[k] === character.abilities[k])) {
      return;
    }
    resyncedFrom.current = character.abilities;
    const source =
      method === "standard"
        ? STANDARD_ARRAY
        : ABILITY_KEYS.map((k) => character.abilities[k]);
    const next = poolStateFromScores(character.abilities, source);
    setAssignments(next.assignments);
    setPool(next.pool);
  }, [method, character.abilities, assignments]);

  const syncAssignmentsToCharacter = useCallback(
    (next: Partial<Record<AbilityKey, number>>) => {
      setAbilityScores(poolAssignmentsToScores(next));
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
    setAbilityScoreMethod(next);
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

  // Values to distribute by class priority: the standard array (also a full
  // 27-point point-buy spread), or the complete dice roll once rolled.
  const rolledValues = [
    ...Object.values(assignments).filter((v): v is number => v !== undefined),
    ...pool,
  ];
  const recommendationValues: readonly number[] | null =
    method === "dice"
      ? rolledValues.length === ABILITY_KEYS.length
        ? rolledValues
        : null
      : STANDARD_ARRAY;

  const applyRecommendedScores = (priority: AbilityKey[]) => {
    if (!recommendationValues) return;
    const next = assignValuesByPriority(recommendationValues, priority);
    if (method === "standard" || method === "dice") {
      setAssignments(next);
      setPool([]);
    }
    setAbilityScores(poolAssignmentsToScores(next));
  };

  const adjustManual = (key: AbilityKey, delta: number) => {
    const next = character.abilities[key] + delta;
    if (next < 1 || next > 30) return;
    setAbilityScore(key, next);
  };

  const pointsRemaining = pointBuyRemaining(character.abilities);
  const pointsSpent = pointBuyTotalSpent(character.abilities);
  const poolLabel = pool.length > 0 ? pool.join(", ") : "—";

  return {
    method,
    pool,
    assignments,
    heroicRolls,
    lastRolls,
    setHeroicRolls,
    handleMethodChange,
    handlePoolAssign,
    rollDice,
    adjustPointBuy,
    adjustManual,
    applyRecommendedScores,
    canApplyRecommended: recommendationValues !== null,
    initPointBuy,
    pointsRemaining,
    pointsSpent,
    poolLabel,
    character,
    setAbilityScore,
  };
}
