import { Package } from "lucide-react";
import { cn } from "@/shared/utils/cn";

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
    <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onTabChange(type)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === type
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Package className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[120px]">{type}</span>
        </button>
      ))}
    </div>
  );
}
