import { parseCR } from "@/shared/utils/cr.utils";
import {
  ENCOUNTER_DIFFICULTY_LABELS,
  getEncounterMultiplier,
  type EncounterDifficultyRating,
  type EncounterThresholds,
  XP_BY_CR,
  XP_THRESHOLDS_BY_LEVEL,
} from "../data/encounter-xp.data";

export interface EncounterCreatureInput {
  id: string;
  name: string;
  cr: string;
  count: number;
}

export interface EncounterDifficultyResult {
  rating: EncounterDifficultyRating;
  label: string;
  totalXp: number;
  adjustedXp: number;
  multiplier: number;
  monsterCount: number;
  budget: EncounterThresholds;
  description: string;
}

function normalizeCrKey(cr: string): string {
  const trimmed = cr.trim();
  if (trimmed in XP_BY_CR) return trimmed;
  const numeric = parseCR(trimmed);
  if (Number.isInteger(numeric)) return String(numeric);
  if (numeric === 0.125) return "1/8";
  if (numeric === 0.25) return "1/4";
  if (numeric === 0.5) return "1/2";
  return String(numeric);
}

export function getXpForCr(cr: string): number {
  const key = normalizeCrKey(cr);
  return XP_BY_CR[key] ?? 0;
}

export function getPartyXpBudget(partyLevels: number[]): EncounterThresholds {
  const budget: EncounterThresholds = {
    easy: 0,
    medium: 0,
    hard: 0,
    deadly: 0,
  };

  for (const level of partyLevels) {
    const clamped = Math.min(20, Math.max(1, level));
    const thresholds = XP_THRESHOLDS_BY_LEVEL[clamped];
    budget.easy += thresholds.easy;
    budget.medium += thresholds.medium;
    budget.hard += thresholds.hard;
    budget.deadly += thresholds.deadly;
  }

  return budget;
}

function rateEncounter(
  adjustedXp: number,
  budget: EncounterThresholds,
): EncounterDifficultyRating {
  if (adjustedXp >= budget.deadly) return "deadly";
  if (adjustedXp >= budget.hard) return "hard";
  if (adjustedXp >= budget.medium) return "medium";
  return "easy";
}

export function getEncounterDifficulty(
  partyLevels: number[],
  creatures: EncounterCreatureInput[],
): EncounterDifficultyResult {
  const budget = getPartyXpBudget(partyLevels);
  const totalXp = creatures.reduce(
    (sum, creature) => sum + getXpForCr(creature.cr) * creature.count,
    0,
  );
  const monsterCount = creatures.reduce((sum, creature) => sum + creature.count, 0);
  const multiplier = getEncounterMultiplier(monsterCount);
  const adjustedXp = Math.round(totalXp * multiplier);
  const rating = rateEncounter(adjustedXp, budget);

  return {
    rating,
    label: ENCOUNTER_DIFFICULTY_LABELS[rating],
    totalXp,
    adjustedXp,
    multiplier,
    monsterCount,
    budget,
    description: `${adjustedXp} adjusted XP (${totalXp} base × ${multiplier}) vs party budgets.`,
  };
}

export function createCreatureId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
