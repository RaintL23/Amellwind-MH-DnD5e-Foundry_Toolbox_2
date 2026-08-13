import { Package } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_TRIGGER_CLASS =
  "gap-1.5 px-3 py-1.5 h-auto rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-none";

export function ItemTabBar({
  types,
  activeTab,
  onTabChange,
}: {
  types: string[];
  activeTab: string;
  onTabChange: (type: string) => void;
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="mb-6 border-b border-border pb-3"
    >
      <TabsList className="flex flex-wrap justify-start gap-1.5 h-auto rounded-none bg-transparent p-0 text-muted-foreground">
        {types.map((type) => (
          <TabsTrigger key={type} value={type} className={TAB_TRIGGER_CLASS}>
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[120px]">{type}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

