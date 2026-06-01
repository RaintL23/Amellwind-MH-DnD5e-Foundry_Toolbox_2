import { ENVIRONMENT_COLORS, type Environment } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { MapPin } from "lucide-react";
import {
  BIOME_ICONS,
  ENVIRONMENT_RULES,
} from "../constants/environment.constants";
import { RuleText } from "./RuleText";

export function RulesTab({
  environments,
  onSelect,
}: {
  environments: Environment[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ENVIRONMENT_RULES.filter((r) => r.term).map((rule) => (
          <div
            key={rule.term}
            className="rounded-lg border border-border bg-card p-4"
          >
            <h3 className="font-semibold text-foreground mb-1.5">
              {rule.term}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <RuleText raw={rule.text} />
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {ENVIRONMENT_RULES[0].text}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Locations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {environments.map((env) => {
            const colors =
              ENVIRONMENT_COLORS[env.name] ??
              ENVIRONMENT_COLORS["Verdant Hills"];
            return (
              <button
                key={env.name}
                onClick={() => onSelect(env.name)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-150",
                  "hover:scale-[1.03] hover:shadow-md cursor-pointer text-center",
                  colors.bg,
                  colors.border,
                )}
              >
                <span className="text-2xl">
                  {BIOME_ICONS[env.name] ?? "🗺️"}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    colors.accent,
                  )}
                >
                  {env.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {env.biome}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
