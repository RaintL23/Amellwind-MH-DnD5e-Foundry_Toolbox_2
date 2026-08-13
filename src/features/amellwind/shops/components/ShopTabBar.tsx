import { Store } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shop } from "@/shared/types";

const TAB_TRIGGER_CLASS =
  "gap-1.5 px-3 py-1.5 h-auto rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-none";

export function ShopTabBar({
  shops,
  activeTab,
  onTabChange,
}: {
  shops: Shop[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="mb-6 border-b border-border pb-3"
    >
      <TabsList className="flex flex-wrap justify-start gap-1.5 h-auto rounded-none bg-transparent p-0 text-muted-foreground">
        {shops.map((shop) => (
          <TabsTrigger key={shop.id} value={shop.id} className={TAB_TRIGGER_CLASS}>
            <Store className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[140px]">{shop.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

