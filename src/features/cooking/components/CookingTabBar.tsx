import type { ReactNode } from "react";
import { BookOpen, Dices, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COOKING_TAB_CONFIG } from "../constants/cooking.constants";
import type { CookingActiveTab } from "@/shared/types";

const TAB_TRIGGER_CLASS =
  "gap-1.5 px-3 py-1.5 h-auto rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-none";

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
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as CookingActiveTab)}
      className="mb-6 border-b border-border pb-3"
    >
      <TabsList className="flex flex-wrap justify-start gap-1.5 h-auto rounded-none bg-transparent p-0 text-muted-foreground">
        {COOKING_TAB_CONFIG.map(({ id, label }) => (
          <TabsTrigger key={id} value={id} className={TAB_TRIGGER_CLASS}>
            {TAB_ICONS[id]}
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

