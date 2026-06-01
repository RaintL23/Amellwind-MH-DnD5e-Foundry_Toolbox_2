import { useState } from "react";
import type { LevelTier } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Shield,
  Swords,
  Zap,
} from "lucide-react";
import type { EnvironmentColors } from "../constants/environment.constants";
import { EncounterTable } from "./EncounterTable";
import { ResourceTable } from "./ResourceTable";

export function LevelTierSection({
  tier,
  index,
  colors,
}: {
  tier: LevelTier;
  index: number;
  colors: EnvironmentColors;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [tab, setTab] = useState<"resources" | "encounters">("resources");

  return (
    <div className={cn("rounded-lg border overflow-hidden", colors.border)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent/20",
          expanded ? cn("bg-gradient-to-r", colors.bg) : "bg-card/40",
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", colors.accent)}>Player Level</span>
          <span>{tier.levelRange}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-md bg-card/50 p-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Swords className="h-3 w-3" />
                Common Small Monsters
              </div>
              <p className="text-xs text-foreground">
                {tier.commonSmallMonsters}
              </p>
            </div>
            <div className="rounded-md bg-card/50 p-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Shield className="h-3 w-3" />
                Common Large Monsters
              </div>
              <p className="text-xs text-foreground">
                {tier.commonLargeMonsters}
              </p>
            </div>
          </div>

          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("resources")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1",
                tab === "resources"
                  ? cn(
                      "border-b-2 text-foreground",
                      colors.accent,
                      "border-current",
                    )
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Package className="h-3 w-3" />
              Resources
            </button>
            <button
              onClick={() => setTab("encounters")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1",
                tab === "encounters"
                  ? cn(
                      "border-b-2 text-foreground",
                      colors.accent,
                      "border-current",
                    )
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Zap className="h-3 w-3" />
              Encounters
            </button>
          </div>

          {tab === "resources" && <ResourceTable tier={tier} colors={colors} />}
          {tab === "encounters" && <EncounterTable tier={tier} />}
        </div>
      )}
    </div>
  );
}
