import { Store } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Shop } from "@/shared/types";

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
    <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
      {shops.map((shop) => (
        <button
          key={shop.id}
          onClick={() => onTabChange(shop.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === shop.id
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Store className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[140px]">{shop.name}</span>
        </button>
      ))}
    </div>
  );
}
