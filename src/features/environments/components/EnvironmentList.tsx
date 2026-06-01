import { useMemo, useState } from "react";
import { ENVIRONMENT_COLORS, type Environment } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { BookOpen, Dice6, MapPin } from "lucide-react";
import { getAllEnvironments } from "../services/environment.service";
import { BIOME_ICONS } from "../constants/environment.constants";
import { EnvironmentDetailContent } from "./EnvironmentDetailContent";
import { EnvironmentRollsTab } from "./EnvironmentRollsTab";
import { RulesTab } from "./RulesTab";
import { SearchResultsPanel } from "./SearchResultsPanel";

type ActiveTab = "rules" | "rolls" | string;

export function EnvironmentList() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("rules");
  const [search, setSearch] = useState("");

  const allEnvironments = getAllEnvironments();

  const isSearching = search.trim().length > 0;
  const filtered = useMemo(() => {
    if (!isSearching) return allEnvironments;
    const q = search.toLowerCase();
    return allEnvironments.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.biome.toLowerCase().includes(q) ||
        e.commonWeather.toLowerCase().includes(q),
    );
  }, [allEnvironments, search, isSearching]);

  const activeEnvironment =
    allEnvironments.find((e) => e.name === activeTab) ?? null;

  function handleSelect(nameOrEnv: string | Environment) {
    const name = typeof nameOrEnv === "string" ? nameOrEnv : nameOrEnv.name;
    setActiveTab(name);
    setSearch("");
  }

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <MapPin className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Environments</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Biomes and hunting locations with encounters and resources per level
          range.
        </p>
      </div>

      {isSearching ? (
        <SearchResultsPanel environments={filtered} onSelect={handleSelect} />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
            <button
              onClick={() => setActiveTab("rules")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === "rules"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              Location Rules
            </button>
            <button
              onClick={() => setActiveTab("rolls")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === "rolls"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Dice6 className="h-3.5 w-3.5 shrink-0" />
              Rolls in an Environment
            </button>

            {allEnvironments.map((env) => {
              const colors =
                ENVIRONMENT_COLORS[env.name] ??
                ENVIRONMENT_COLORS["Verdant Hills"];
              const isActive = activeTab === env.name;
              return (
                <button
                  key={env.name}
                  onClick={() => setActiveTab(env.name)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                    isActive
                      ? cn(colors.bg, colors.border, colors.accent)
                      : "text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <span className="text-base leading-none">
                    {BIOME_ICONS[env.name] ?? "🗺️"}
                  </span>
                  <span className="truncate max-w-[110px]">{env.name}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "rules" && (
            <RulesTab environments={allEnvironments} onSelect={handleSelect} />
          )}
          {activeTab === "rolls" && (
            <EnvironmentRollsTab environments={allEnvironments} />
          )}
          {activeEnvironment && (
            <EnvironmentDetailContent environment={activeEnvironment} />
          )}
        </>
      )}
    </div>
  );
}
