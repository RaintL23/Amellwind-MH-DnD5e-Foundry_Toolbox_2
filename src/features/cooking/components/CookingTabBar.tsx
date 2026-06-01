import type { ReactNode } from "react";
import { BookOpen, Dices, Star } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { COOKING_TAB_CONFIG } from "../constants/cooking.constants";
import type { CookingActiveTab } from "@/shared/types";

const TAB_ICONS: Partial<Record<CookingActiveTab, ReactNode>> = {
  rules: <BookOpen className="h-3.5 w-3.5" />,
  rank1: <Star className="h-3.5 w-3.5" />,
  rank2: <Star className="h-3.5 w-3.5" />,
  rank3: <Star className="h-3.5 w-3.5" />,
  rank4: <Star className="h-3.5 w-3.5" />,
  daily: <Dices className="h-3.5 w-3.5" />,
};

export function CookingTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: CookingActiveTab;
  onTabChange: (tab: CookingActiveTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
      {COOKING_TAB_CONFIG.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === id
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {TAB_ICONS[id]}
          {label}
        </button>
      ))}
    </div>
  );
}
