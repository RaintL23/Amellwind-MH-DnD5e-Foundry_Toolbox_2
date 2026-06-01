import { useState } from "react";
import { ChefHat } from "lucide-react";
import {
  getAllDailySkills,
  getAllMealTables,
} from "../services/cooking.service";
import { COOKING_RANK_TABS } from "../constants/cooking.constants";
import { useCookingRoll } from "../hooks/useCookingRoll";
import { useItemDescMap } from "@/features/shops/hooks/useItemDescMap";
import {
  type CookingActiveTab,
  cookingRankFromTab,
} from "@/shared/types";
import { CookingDailyTab } from "./CookingDailyTab";
import { CookingRankTab } from "./CookingRankTab";
import { CookingRulesTab } from "./CookingRulesTab";
import { CookingTabBar } from "./CookingTabBar";

export function CookingPage() {
  const [activeTab, setActiveTab] = useState<CookingActiveTab>("rules");
  const itemDescMap = useItemDescMap();
  const { rollResult, rolling, triggerRoll, clearRoll } = useCookingRoll();

  const mealTables = getAllMealTables();
  const dailySkills = getAllDailySkills();

  const handleTabChange = (tab: CookingActiveTab) => {
    setActiveTab(tab);
    clearRoll();
  };

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ChefHat className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Artisan Cooking System
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Craft meals that grant powerful boons to your hunting party.
        </p>
      </div>

      <CookingTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "rules" && (
        <CookingRulesTab
          mealTables={mealTables}
          onSelectRank={handleTabChange}
        />
      )}

      {COOKING_RANK_TABS.map((tabId) => {
        if (activeTab !== tabId) return null;
        const rank = cookingRankFromTab(tabId);
        const table = mealTables.find((t) => t.rank === rank);
        if (!table) return null;

        return (
          <CookingRankTab
            key={tabId}
            rank={rank}
            table={table}
            rollResult={rollResult}
            rolling={rolling}
            itemDescMap={itemDescMap}
            onRoll={triggerRoll}
            onCloseResult={clearRoll}
          />
        );
      })}

      {activeTab === "daily" && (
        <CookingDailyTab
          dailySkills={dailySkills}
          rollResult={rollResult}
          rolling={rolling}
          itemDescMap={itemDescMap}
          onRoll={() => triggerRoll("daily")}
          onCloseResult={clearRoll}
        />
      )}
    </div>
  );
}
