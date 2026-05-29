import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ENVIRONMENT_COLORS, type Environment, type LevelTier } from "@/shared/types";
import { RESOURCE_CATEGORY_ICONS } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { MapPin, Wind, Compass, Zap, Search, Package, Swords, Shield, ChevronDown, ChevronUp } from "lucide-react";

function StatBadge({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card/60 px-3 py-2 min-w-[70px]">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function ResourceTable({ tier, colors }: { tier: LevelTier; colors: { badge: string } }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-card/80">
            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium w-8">d6</th>
            {tier.resources.columns.map((col) => (
              <th key={col.category} className="px-2 py-1.5 text-center text-muted-foreground font-medium">
                <div className="flex flex-col items-center gap-0.5">
                  <span>{RESOURCE_CATEGORY_ICONS[col.category]}</span>
                  <span>{col.category}</span>
                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0", colors.badge)}>
                    DC {col.dc}
                  </Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tier.resources.rows.map((row) => (
            <tr key={row.roll} className="border-t border-border/50 hover:bg-accent/20 transition-colors">
              <td className="px-2 py-1.5 text-center font-bold text-muted-foreground">{row.roll}</td>
              {row.items.map((item, i) => (
                <td key={i} className="px-2 py-1.5 text-center text-foreground">
                  {item}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EncounterTable({ tier }: { tier: LevelTier }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-card/80">
            <th className="px-2 py-1.5 text-center text-muted-foreground font-medium w-10">d10</th>
            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Encounter</th>
          </tr>
        </thead>
        <tbody>
          {tier.encounters.map((enc) => (
            <tr key={enc.roll} className="border-t border-border/50 hover:bg-accent/20 transition-colors">
              <td className="px-2 py-1.5 text-center font-bold text-muted-foreground">{enc.roll}</td>
              <td className="px-2 py-1.5 text-foreground">{enc.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LevelTierSection({
  tier,
  index,
  colors,
}: {
  tier: LevelTier;
  index: number;
  colors: ReturnType<typeof Object.values<{ accent: string; bg: string; border: string; badge: string }>>[0];
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [tab, setTab] = useState<"resources" | "encounters">("resources");

  return (
    <div className={cn("rounded-lg border overflow-hidden", colors.border)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors",
          "hover:bg-accent/20",
          expanded ? cn("bg-gradient-to-r", colors.bg) : "bg-card/40"
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", colors.accent)}>Player Level</span>
          <span>{tier.levelRange}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-border/50">
          {/* Monsters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-md bg-card/50 p-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Swords className="h-3 w-3" />
                Common Small Monsters
              </div>
              <p className="text-xs text-foreground">{tier.commonSmallMonsters}</p>
            </div>
            <div className="rounded-md bg-card/50 p-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Shield className="h-3 w-3" />
                Common Large Monsters
              </div>
              <p className="text-xs text-foreground">{tier.commonLargeMonsters}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("resources")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                tab === "resources"
                  ? cn("border-b-2 text-foreground", `border-current ${colors.accent}`)
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Resources
              </span>
            </button>
            <button
              onClick={() => setTab("encounters")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                tab === "encounters"
                  ? cn("border-b-2 text-foreground", `border-current ${colors.accent}`)
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Encounters
              </span>
            </button>
          </div>

          {tab === "resources" && <ResourceTable tier={tier} colors={colors} />}
          {tab === "encounters" && <EncounterTable tier={tier} />}
        </div>
      )}
    </div>
  );
}

interface EnvironmentDetailDialogProps {
  environment: Environment | null;
  open: boolean;
  onClose: () => void;
}

export function EnvironmentDetailDialog({ environment, open, onClose }: EnvironmentDetailDialogProps) {
  if (!environment) return null;

  const colors = ENVIRONMENT_COLORS[environment.name] ?? ENVIRONMENT_COLORS["Verdant Hills"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className={cn("h-5 w-5", colors.accent)} />
            {environment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* Biome + Stats */}
          <div className={cn("rounded-lg border p-3 bg-gradient-to-br", colors.bg, colors.border)}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              <span className="font-semibold">Biome:</span>
              <span className={colors.accent}>{environment.biome}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatBadge label="Navigation DC" value={environment.navigationDC} icon={<Compass className="h-3 w-3" />} />
              <StatBadge label="Encounter DC" value={environment.encounterDC} icon={<Zap className="h-3 w-3" />} />
              <StatBadge label="Investigation DC" value={environment.investigationDC} icon={<Search className="h-3 w-3" />} />
              <StatBadge label="Total Resources" value={environment.totalResources} icon={<Package className="h-3 w-3" />} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Wind className="h-3 w-3" />
              <span className="font-semibold">Common Weather:</span>
              <span className="text-foreground">{environment.commonWeather}</span>
            </div>
          </div>

          {/* Special Rules */}
          {environment.specialRules.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Special Rules
              </h3>
              <div className="space-y-2">
                {environment.specialRules.map((rule) => (
                  <div key={rule.name} className="rounded-md border border-border bg-card/50 p-2.5">
                    <p className="text-xs font-semibold text-foreground mb-1">{rule.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather Table */}
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
                      <th className="px-3 py-1.5 text-center text-muted-foreground font-medium w-16">d20</th>
                      <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">Weather</th>
                    </tr>
                  </thead>
                  <tbody>
                    {environment.weatherTable.map((row) => (
                      <tr key={row.roll} className="border-t border-border/50 hover:bg-accent/20 transition-colors">
                        <td className="px-3 py-1.5 text-center font-semibold text-muted-foreground">{row.roll}</td>
                        <td className="px-3 py-1.5 text-foreground">{row.weather}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Separator />

          {/* Level Tiers */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Encounters & Resources by Level
            </h3>
            <div className="space-y-2">
              {environment.levelTiers.map((tier, i) => (
                <LevelTierSection key={tier.levelRange} tier={tier} index={i} colors={colors} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
