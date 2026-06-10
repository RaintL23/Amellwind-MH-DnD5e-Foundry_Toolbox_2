import { ENVIRONMENT_COLORS, type Environment } from "@/shared/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import {
  Compass,
  MapPin,
  Package,
  Search,
  Shield,
  Wind,
  Zap,
} from "lucide-react";
import { LevelTierSection } from "./LevelTierSection";
import { StatBadge } from "./StatBadge";

export function EnvironmentDetailContent({
  environment,
}: {
  environment: Environment;
}) {
  const colors =
    ENVIRONMENT_COLORS[environment.name] ?? ENVIRONMENT_COLORS["Verdant Hills"];

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-lg border p-4 bg-gradient-to-br",
          colors.bg,
          colors.border,
        )}
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          <span className="font-semibold">Biome:</span>
          <span className={colors.accent}>{environment.biome}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <StatBadge
            label="Navigation DC"
            value={environment.navigationDC}
            icon={<Compass className="h-3 w-3" />}
          />
          <StatBadge
            label="Encounter DC"
            value={environment.encounterDC}
            icon={<Zap className="h-3 w-3" />}
          />
          <StatBadge
            label="Investigation DC"
            value={environment.investigationDC}
            icon={<Search className="h-3 w-3" />}
          />
          <StatBadge
            label="Total Resources"
            value={environment.totalResources}
            icon={<Package className="h-3 w-3" />}
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wind className="h-3 w-3" />
          <span className="font-semibold">Common Weather:</span>
          <span className="text-foreground">{environment.commonWeather}</span>
        </div>
      </div>

      {environment.specialRules.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Special Rules
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {environment.specialRules.map((rule) => (
              <div
                key={rule.name}
                className="rounded-md border border-border bg-card/50 p-3"
              >
                <p className="text-xs font-semibold text-foreground mb-1">
                  {rule.name}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <DndRichText text={rule.description} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {environment.weatherTable && environment.weatherTable.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-400" />
            Weather Table (d20)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-card/80">
                  <th className="px-3 py-1.5 text-center text-muted-foreground font-medium w-16">
                    d20
                  </th>
                  <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">
                    Weather
                  </th>
                </tr>
              </thead>
              <tbody>
                {environment.weatherTable.map((row) => (
                  <tr
                    key={row.roll}
                    className="border-t border-border/50 hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-center font-semibold text-muted-foreground">
                      {row.roll}
                    </td>
                    <td className="px-3 py-1.5 text-foreground">
                      {row.weather}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Encounters & Resources by Level
        </h3>
        <div className="space-y-2">
          {environment.levelTiers.map((tier, i) => (
            <LevelTierSection
              key={tier.levelRange}
              tier={tier}
              index={i}
              colors={colors}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
