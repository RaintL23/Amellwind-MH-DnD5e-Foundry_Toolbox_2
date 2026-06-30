import { AbilityKey, AbilityScores } from "@/shared/types";

export type AbilityScoreGenerationMethod =
  | "manual"
  | "standard"
  | "pointbuy"
  | "dice";

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

/** Total point-buy cost to reach `score` from a base of 8. */
export function pointBuyCost(score: number): number {
  if (score <= POINT_BUY_MIN) return 0;
  let cost = 0;
  for (let s = POINT_BUY_MIN; s < score; s++) {
    cost += pointBuyIncrementCost(s);
  }
  return cost;
}

/** Cost to raise a score by 1 from `from` (8→9 … 14→15). */
export function pointBuyIncrementCost(from: number): number {
  if (from < 13) return 1;
  if (from === 13 || from === 14) return 2;
  return 0;
}

export function pointBuyTotalSpent(abilities: AbilityScores): number {
  return (Object.keys(abilities) as AbilityKey[]).reduce(
    (sum, key) => sum + pointBuyCost(abilities[key]),
    0
  );
}

export function pointBuyRemaining(abilities: AbilityScores): number {
  return POINT_BUY_BUDGET - pointBuyTotalSpent(abilities);
}

export function canRaisePointBuy(
  abilities: AbilityScores,
  key: AbilityKey
): boolean {
  const current = abilities[key];
  if (current >= POINT_BUY_MAX) return false;
  const nextCost =
    pointBuyCost(current + 1) - pointBuyCost(current);
  return pointBuyRemaining(abilities) >= nextCost;
}

export function canLowerPointBuy(abilities: AbilityScores, key: AbilityKey): boolean {
  return abilities[key] > POINT_BUY_MIN;
}

export function defaultPointBuyScores(): AbilityScores {
  return { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/** 4d6 drop lowest; optional heroic re-rolls any 1 on the four dice. */
export function roll4d6DropLowest(heroic = false): number {
  let dice = [rollDie(), rollDie(), rollDie(), rollDie()];
  if (heroic) {
    dice = dice.map((d) => (d === 1 ? rollDie() : d));
  }
  dice.sort((a, b) => b - a);
  return dice[0] + dice[1] + dice[2];
}

export function rollSixAbilityScores(heroic = false): number[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest(heroic));
}

/** Values available to assign to `key` from the pool plus its current assignment. */
export function poolOptionsForAbility(
  key: AbilityKey,
  assignments: Partial<Record<AbilityKey, number>>,
  pool: number[]
): number[] {
  const current = assignments[key];
  const options = [...pool];
  if (current !== undefined) options.push(current);
  return [...new Set(options)].sort((a, b) => b - a);
}

export function assignFromPool(
  key: AbilityKey,
  value: number | null,
  assignments: Partial<Record<AbilityKey, number>>,
  pool: number[]
): { assignments: Partial<Record<AbilityKey, number>>; pool: number[] } {
  const nextPool = [...pool];
  const nextAssignments = { ...assignments };
  const previous = nextAssignments[key];

  if (previous !== undefined) {
    nextPool.push(previous);
  }
  delete nextAssignments[key];

  if (value !== null) {
    const idx = nextPool.indexOf(value);
    if (idx === -1) return { assignments, pool };
    nextPool.splice(idx, 1);
    nextAssignments[key] = value;
  }

  nextPool.sort((a, b) => b - a);
  return { assignments: nextAssignments, pool: nextPool };
}

export function assignmentsToAbilityScores(
  assignments: Partial<Record<AbilityKey, number>>
): Partial<AbilityScores> {
  const result: Partial<AbilityScores> = {};
  for (const [k, v] of Object.entries(assignments)) {
    if (v !== undefined) result[k as AbilityKey] = v;
  }
  return result;
}

export { ABILITY_KEYS } from "@/shared/constants/dnd";
