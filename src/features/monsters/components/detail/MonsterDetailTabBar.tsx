import { BookOpen, Package, ScrollText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type MonsterDetailTab = "statblock" | "bio" | "loot";

const TAB_TRIGGER_CLASS =
  "gap-1.5 px-3 py-1.5 h-auto rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-none";

const TABS: Array<{
  id: MonsterDetailTab;
  label: string;
  icon: typeof ScrollText;
}> = [
  { id: "statblock", label: "Stat Block", icon: ScrollText },
  { id: "bio", label: "Bio", icon: BookOpen },
  { id: "loot", label: "Loot", icon: Package },
];

interface MonsterDetailTabBarProps {
  activeTab: MonsterDetailTab;
  onTabChange: (tab: MonsterDetailTab) => void;
}

export function MonsterDetailTabBar({
  activeTab,
  onTabChange,
}: MonsterDetailTabBarProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as MonsterDetailTab)}
      className="border-b border-border"
    >
      <TabsList className="flex flex-wrap justify-start gap-1.5 h-auto rounded-none bg-transparent p-0 text-muted-foreground">
        {TABS.map(({ id, label, icon: Icon }) => (
          <TabsTrigger key={id} value={id} className={TAB_TRIGGER_CLASS}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
