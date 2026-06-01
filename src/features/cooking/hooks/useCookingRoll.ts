import { useCallback, useState } from "react";
import type { CookingRank } from "@/shared/types";
import { rollDailySkill, rollRandomMeal } from "../services/cooking.service";
import type { CookingActiveTab, CookingRollResult } from "@/shared/types";

const ROLL_ANIMATION_MS = 600;

export function useCookingRoll() {
  const [rollResult, setRollResult] = useState<CookingRollResult | null>(null);
  const [rolling, setRolling] = useState(false);

  const clearRoll = useCallback(() => setRollResult(null), []);

  const triggerRoll = useCallback((tab: CookingActiveTab) => {
    setRolling(true);
    setRollResult(null);
    setTimeout(() => {
      if (tab === "daily") {
        setRollResult(rollDailySkill());
      } else if (tab.startsWith("rank")) {
        const rank = parseInt(tab.replace("rank", ""), 10) as CookingRank;
        const { meal, roll } = rollRandomMeal(rank);
        setRollResult({ meal, roll, total: roll });
      }
      setRolling(false);
    }, ROLL_ANIMATION_MS);
  }, []);

  return { rollResult, rolling, triggerRoll, clearRoll };
}
