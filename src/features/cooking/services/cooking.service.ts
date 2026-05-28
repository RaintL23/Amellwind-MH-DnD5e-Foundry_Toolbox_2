import { Meal, DailySkill, MealTable, CookingRank } from "@/shared/types";
import { MEAL_TABLES, DAILY_SKILLS } from "../data/cooking.data";

export function getAllMealTables(): MealTable[] {
  return MEAL_TABLES;
}

export function getMealTableByRank(rank: CookingRank): MealTable | undefined {
  return MEAL_TABLES.find((t) => t.rank === rank);
}

export function getAllMeals(): Meal[] {
  return MEAL_TABLES.flatMap((t) => t.meals);
}

export function getMealsByRank(rank: CookingRank): Meal[] {
  return getMealTableByRank(rank)?.meals ?? [];
}

export function getAllDailySkills(): DailySkill[] {
  return DAILY_SKILLS;
}

export function rollRandomMeal(rank: CookingRank): { meal: Meal; roll: number } {
  const meals = getMealsByRank(rank);
  const roll = Math.floor(Math.random() * meals.length) + 1;
  return { meal: meals[roll - 1], roll };
}

export function rollDailySkill(): { skill: DailySkill; d20: number; d6: number; total: number } {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const d6 = Math.floor(Math.random() * 6) + 1;
  const total = Math.min(25, Math.max(1, d20 + d6 - 1));
  const skill = DAILY_SKILLS[total - 1];
  return { skill, d20, d6, total };
}
