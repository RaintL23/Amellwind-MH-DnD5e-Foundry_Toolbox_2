export type CookingRank = 1 | 2 | 3 | 4;

export interface Meal {
  name: string;
  dc: number;
  boon: string;
  rank: CookingRank;
}

export interface MealTable {
  rank: CookingRank;
  caption: string;
  footnote: string;
  meals: Meal[];
  levelRequirement: string;
}

export interface DailySkill {
  index: number;
  name: string;
  effect: string;
}

export interface CookingRule {
  name: string;
  content: string[];
}

export type CookingActiveTab = "rules" | `rank${CookingRank}` | "daily";

export interface MealRollResult {
  meal: Meal;
  roll: number;
  total: number;
}

export interface DailySkillRollResult {
  skill: DailySkill;
  d20: number;
  d6: number;
  total: number;
}

export type CookingRollResult = MealRollResult | DailySkillRollResult;

export function isMealRollResult(
  r: CookingRollResult,
): r is MealRollResult {
  return "meal" in r;
}

export function cookingRankFromTab(tab: `rank${CookingRank}`): CookingRank {
  return parseInt(tab.replace("rank", ""), 10) as CookingRank;
}
