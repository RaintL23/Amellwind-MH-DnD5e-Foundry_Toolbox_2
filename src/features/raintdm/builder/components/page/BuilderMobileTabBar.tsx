import { useMemo } from "react";
import { Backpack, Hammer, ListChecks, User, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useBuildCompleteness } from "../../context/BuildCompletenessContext";
import {
  SECTION_TO_MOBILE_TAB,
  useBuilderLayout,
  type BuilderMobileTab,
} from "../../context/BuilderLayoutContext";

export const BUILDER_MOBILE_TABS: {
  id: BuilderMobileTab;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "build", label: "Build", icon: Hammer },
  { id: "character", label: "Character", icon: User },
  { id: "proficiencies", label: "Proficiencies", icon: ListChecks },
  { id: "gear", label: "Gear & Stats", icon: Backpack },
];

export function builderMobileTabPanelId(tab: BuilderMobileTab): string {
  return `builder-tab-panel-${tab}`;
}

/** Thumb-reachable tab bar for the mobile Builder; badges count pending issues per tab. */
export function BuilderMobileTabBar() {
  const { activeTab, setActiveTab } = useBuilderLayout();
  const { liveResult } = useBuildCompleteness();

  const pendingByTab = useMemo(() => {
    const counts: Partial<Record<BuilderMobileTab, number>> = {};
    if (!liveResult.hasStarted) return counts;
    for (const issue of liveResult.issues) {
      const tab = SECTION_TO_MOBILE_TAB[issue.section];
      counts[tab] = (counts[tab] ?? 0) + 1;
    }
    return counts;
  }, [liveResult]);

  return (
    <nav
      className="shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
      aria-label="Builder sections"
    >
      <div role="tablist" className="grid grid-cols-4">
        {BUILDER_MOBILE_TABS.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          const pending = pendingByTab[id] ?? 0;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`builder-tab-${id}`}
              aria-selected={selected}
              aria-controls={builderMobileTabPanelId(id)}
              onClick={() => setActiveTab(id)}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                selected
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "absolute inset-x-4 top-0 h-0.5 rounded-b-full",
                  selected ? "bg-primary" : "bg-transparent",
                )}
                aria-hidden
              />
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden />
                {pending > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-amber-500 px-1 text-center text-[9px] font-bold leading-4 text-black">
                    {pending > 99 ? "99+" : pending}
                    <span className="sr-only"> pending</span>
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
