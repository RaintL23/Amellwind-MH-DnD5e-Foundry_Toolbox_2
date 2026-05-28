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
