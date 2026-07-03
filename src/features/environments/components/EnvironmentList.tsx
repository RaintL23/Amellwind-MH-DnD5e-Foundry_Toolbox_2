import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ENVIRONMENT_COLORS, type Environment } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Dice6, MapPin } from "lucide-react";
import { getAllEnvironments } from "../services/environment.service";
import { BIOME_ICONS } from "../constants/environment.constants";
import { EnvironmentDetailContent } from "./EnvironmentDetailContent";
import { EnvironmentRollsTab } from "./EnvironmentRollsTab";
import { RulesTab } from "./RulesTab";
import { SearchResultsPanel } from "./SearchResultsPanel";
import { setIfPresent } from "@/shared/utils/list-url-params.utils";

type ActiveTab = "rules" | "rolls" | string;

export function EnvironmentList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const activeTab = (searchParams.get("tab") ?? "rules") as ActiveTab;

  const allEnvironments = getAllEnvironments();

  const patchUrl = useCallback(
    (patch: { q?: string; tab?: ActiveTab }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          const q = "q" in patch ? (patch.q ?? "") : (prev.get("q") ?? "");
          const tab =
            "tab" in patch ? (patch.tab ?? "rules") : (prev.get("tab") ?? "rules");
          setIfPresent(next, "q", q);
          if (tab && tab !== "rules") next.set("tab", tab);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

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
    patchUrl({ tab: name, q: "" });
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
          <Tabs
            value={activeTab}
            onValueChange={(tab) => patchUrl({ tab })}
            className="mb-6 border-b border-border pb-3"
          >
            <TabsList className="flex flex-wrap justify-start gap-1.5 h-auto rounded-none bg-transparent p-0 text-muted-foreground">
              <TabsTrigger
                value="rules"
                className="gap-1.5 px-3 py-1.5 h-auto rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-none"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                Location Rules
              </TabsTrigger>
              <TabsTrigger
                value="rolls"
                className="gap-1.5 px-3 py-1.5 h-auto rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-none"
              >
                <Dice6 className="h-3.5 w-3.5 shrink-0" />
                Rolls in an Environment
              </TabsTrigger>

              {allEnvironments.map((env) => {
                const colors =
                  ENVIRONMENT_COLORS[env.name] ??
                  ENVIRONMENT_COLORS["Verdant Hills"];
                const isActive = activeTab === env.name;
                return (
                  <TabsTrigger
                    key={env.name}
                    value={env.name}
                    className={cn(
                      "gap-1.5 px-3 py-1.5 h-auto rounded-md border",
                      isActive
                        ? cn(colors.bg, colors.border, colors.accent)
                        : "text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <span className="text-base leading-none">
                      {BIOME_ICONS[env.name] ?? "🗺️"}
                    </span>
                    <span className="truncate max-w-[110px]">{env.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {activeTab === "rules" && <RulesTab />}
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
