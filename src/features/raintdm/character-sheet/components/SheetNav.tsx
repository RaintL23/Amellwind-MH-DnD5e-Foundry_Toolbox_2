import {
  Swords,
  Backpack,
  BookOpen,
  Wand2,
  ListChecks,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

export type SheetTabId =
  | "actions"
  | "spells"
  | "features"
  | "inventory"
  | "stats"
  | "rolls";

export interface SheetTabDef {
  id: SheetTabId;
  label: string;
  icon: LucideIcon;
  hide?: boolean;
}

export function buildSheetTabs(hasSpells: boolean): SheetTabDef[] {
  return [
    { id: "actions", label: "Actions", icon: Swords },
    { id: "spells", label: "Spells", icon: Wand2, hide: !hasSpells },
    { id: "features", label: "Features", icon: BookOpen },
    { id: "inventory", label: "Inventory", icon: Backpack },
    { id: "stats", label: "Stats", icon: ListChecks },
    { id: "rolls", label: "Roll Log", icon: ScrollText },
  ];
}

interface SheetNavProps {
  tabs: SheetTabDef[];
  tab: SheetTabId;
  onTabChange: (id: SheetTabId) => void;
  /** Hide Stats / Roll Log when shown in side rails */
  hideStats?: boolean;
  hideRolls?: boolean;
  variant: "bottom" | "top";
}

export function SheetNav({
  tabs,
  tab,
  onTabChange,
  hideStats,
  hideRolls,
  variant,
}: SheetNavProps) {
  const visible = tabs.filter((t) => {
    if (t.hide) return false;
    if (hideStats && t.id === "stats") return false;
    if (hideRolls && t.id === "rolls") return false;
    return true;
  });

  if (variant === "bottom") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex justify-around">
          {visible.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px]",
                  tab === t.id ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => onTabChange(t.id)}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <div className="mx-auto hidden w-full max-w-7xl gap-2 border-b border-border bg-background px-3 py-2 lg:flex">
      {visible.map((t) => (
        <Button
          key={t.id}
          type="button"
          size="sm"
          className="min-h-9"
          variant={tab === t.id ? "default" : "outline"}
          onClick={() => onTabChange(t.id)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
