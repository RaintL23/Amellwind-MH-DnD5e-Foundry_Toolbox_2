import { ENVIRONMENT_COLORS, type Environment } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Search } from "lucide-react";
import { BIOME_ICONS } from "../constants/environment.constants";

export function SearchResultsPanel({
  environments,
  onSelect,
}: {
  environments: Environment[];
  onSelect: (env: Environment) => void;
}) {
  if (environments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">No results</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          No environments match that search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {environments.length} environment{environments.length !== 1 ? "s" : ""}{" "}
        found.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {environments.map((env) => {
          const colors =
            ENVIRONMENT_COLORS[env.name] ?? ENVIRONMENT_COLORS["Verdant Hills"];
          return (
            <button
              key={env.name}
              onClick={() => onSelect(env)}
              className={cn(
                "text-left rounded-xl border p-4 bg-gradient-to-br transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
                colors.bg,
                colors.border,
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {BIOME_ICONS[env.name] ?? "🗺️"}
                </span>
                <div>
                  <p
                    className={cn(
                      "font-bold text-sm group-hover:underline",
                      colors.accent,
                    )}
                  >
                    {env.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {env.biome}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { label: "Nav", value: env.navigationDC },
                  { label: "Enc", value: env.encounterDC },
                  { label: "Inv", value: env.investigationDC },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded bg-black/20 py-0.5">
                    <p className="text-xs font-bold text-foreground">{value}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {label} DC
                    </p>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
