import { useState, useMemo } from "react";
import {
  ENVIRONMENT_COLORS,
  RESOURCE_CATEGORY_ICONS,
  type Environment,
  type LevelTier,
} from "@/shared/types";
import { getAllEnvironments } from "../services/environment.service";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/shared/utils/cn";
import {
  Search,
  MapPin,
  Compass,
  Zap,
  Package,
  Wind,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Swords,
  Shield,
  Dice6,
} from "lucide-react";

// ── 5etools markup parser ─────────────────────────────────────────────────

interface RuleSegment {
  type: "text" | "bold" | "link";
  content: string;
  href?: string;
}

function parseRuleText(raw: string): RuleSegment[] {
  const segments: RuleSegment[] = [];
  const regex =
    /\{@b ([^}]+)\}|\{@link ([^|]+)\|([^}]+)\}|\{@[a-zA-Z]+ ([^}|]+)(?:\|[^}]*)?\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > last)
      segments.push({ type: "text", content: raw.slice(last, match.index) });
    if (match[1] !== undefined)
      segments.push({ type: "bold", content: match[1] });
    else if (match[2] !== undefined)
      segments.push({ type: "link", content: match[2], href: match[3] });
    else if (match[4] !== undefined)
      segments.push({ type: "text", content: match[4] });
    last = match.index + match[0].length;
  }
  if (last < raw.length)
    segments.push({ type: "text", content: raw.slice(last) });
  return segments;
}

function RuleText({ raw }: { raw: string }) {
  const segments = parseRuleText(raw);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "bold")
          return (
            <strong key={i} className="text-foreground font-semibold">
              {seg.content}
            </strong>
          );
        if (seg.type === "link")
          return (
            <a
              key={i}
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-sky-400 hover:underline"
            >
              {seg.content}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        return <span key={i}>{seg.content}</span>;
      })}
    </>
  );
}

const ENVIRONMENT_RULES: Array<{ term?: string; text: string }> = [
  {
    text: "There are many different environments and locations that these creatures dwell in. In the location stat blocks below you will find out information about each location.",
  },
  {
    term: "Biome.",
    text: "the biome tells what type of areas you would see in the location.",
  },
  {
    term: "Navigation DC.",
    text: "Determines the difficulty of skill checks for finding safe passage through the terrain, the trailblazer DC if they are not hunting a specific monster, and any other checks related to navigating.",
  },
  {
    term: "Encounter DC.",
    text: "The Encounter DC determines how often a random encounter may or may not occur. Roll a d20, if the roll equals or exceeds the Encounter DC roll on the encounter table within the stat block.",
  },
  {
    term: "Investigation DC.",
    text: "When a character attempts to locate resources to gather while on a hunt, they must make an Intelligence (Investigation) check against the location's Investigation DC. On a success, the GM determines what type of resources are nearby.",
  },
  {
    term: "Full size Map.",
    text: "{@link Monster Hunter World Map 2000x1387|https://drive.google.com/open?id=1mkk3L-DajBFKjouEe-f8HwcGN57cCu4O}",
  },
  {
    term: "Total Resources.",
    text: "The total resources number is the maximum amount of times a Resource check can be made on a Hunt.",
  },
  {
    term: "Resources.",
    text: "When a character attempts to fish, mine, catch insects, or gather plants they must make a skill check against the Resources DC in addition to having the proper equipment. A character must have fishing tackle (PHB 150) to fish, a miner's pick (PHB 150) to mine ore, a bug net (2 gp) for catching insects, or an herbalism kit (PHB 154) to gather plants. A character can attempt to gather plants without a herbalist kit but does so at disadvantage. If the character succeeds, they roll a d6 and receive the item listed in the resources table.",
  },
  {
    term: "Common Small Monsters.",
    text: "Typical smaller monsters seen in this area for the level range.",
  },
  {
    term: "Common Large Monsters.",
    text: "Typical large monsters seen in this area for the level range.",
  },
  {
    term: "Common Weather.",
    text: "The usual type of weather that occurs in the area.",
  },
];

const BIOME_ICONS: Record<string, string> = {
  "Ancestral Steppes": "🌄",
  "The Dunes": "🏜️",
  Jungle: "🌴",
  Ocean: "🌊",
  "Snowy Mountains": "🏔️",
  "Verdant Hills": "🌿",
  Volcano: "🌋",
  "The Wetlands": "🐊",
};

type RollMode = "normal" | "advantage" | "disadvantage";

type RollSection =
  | "navigation"
  | "encounter-check"
  | "weather"
  | "investigation"
  | "resources";

interface RollEntry {
  id: string;
  createdAt: Date;
  environmentName: string;
  levelRange: string;
  section: RollSection;
  label: string;
  details: string;
  result: string;
  success?: boolean;
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function rollD20WithMode(mode: RollMode): {
  selected: number;
  rolls: number[];
  mode: RollMode;
} {
  if (mode === "normal") {
    const value = rollDie(20);
    return { selected: value, rolls: [value], mode };
  }
  const first = rollDie(20);
  const second = rollDie(20);
  const selected = mode === "advantage" ? Math.max(first, second) : Math.min(first, second);
  return { selected, rolls: [first, second], mode };
}

function rollFromRangeLabel(raw: string): number {
  if (raw.includes("-")) {
    const [minRaw, maxRaw] = raw.split("-");
    const min = Number.parseInt(minRaw.trim(), 10);
    const max = Number.parseInt(maxRaw.trim(), 10);
    if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
      return min + Math.floor(Math.random() * (max - min + 1));
    }
  }
  const parsed = Number.parseInt(raw.trim(), 10);
  if (Number.isFinite(parsed)) return parsed;
  return 1;
}

function findResourceRowByRoll(rows: LevelTier["resources"]["rows"], roll: number) {
  return rows.find((row) => {
    if (row.roll.includes("-")) {
      const [minRaw, maxRaw] = row.roll.split("-");
      const min = Number.parseInt(minRaw.trim(), 10);
      const max = Number.parseInt(maxRaw.trim(), 10);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return roll >= min && roll <= max;
      }
    }
    return Number.parseInt(row.roll, 10) === roll;
  });
}

function findEncounterByRoll(encounters: LevelTier["encounters"], roll: number) {
  return encounters.find((enc) => {
    if (enc.roll.includes("-")) {
      const [minRaw, maxRaw] = enc.roll.split("-");
      const min = Number.parseInt(minRaw.trim(), 10);
      const max = Number.parseInt(maxRaw.trim(), 10);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return roll >= min && roll <= max;
      }
    }
    return Number.parseInt(enc.roll, 10) === roll;
  });
}

function findWeatherByRoll(weatherTable: NonNullable<Environment["weatherTable"]>, roll: number) {
  return weatherTable.find((row) => {
    if (row.roll.includes("-")) {
      const [minRaw, maxRaw] = row.roll.split("-");
      const min = Number.parseInt(minRaw.trim(), 10);
      const max = Number.parseInt(maxRaw.trim(), 10);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return roll >= min && roll <= max;
      }
    }
    return Number.parseInt(row.roll, 10) === roll;
  });
}

// ── Inline sub-components (shared with detail view) ───────────────────────

function StatBadge({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card/60 px-3 py-2 min-w-[70px]">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function ResourceTable({
  tier,
  colors,
}: {
  tier: LevelTier;
  colors: { badge: string };
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-card/80">
            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium w-8">
              d6
            </th>
            {tier.resources.columns.map((col) => (
              <th
                key={col.category}
                className="px-2 py-1.5 text-center text-muted-foreground font-medium"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{RESOURCE_CATEGORY_ICONS[col.category]}</span>
                  <span>{col.category}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[9px] px-1 py-0", colors.badge)}
                  >
                    DC {col.dc}
                  </Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tier.resources.rows.map((row) => (
            <tr
              key={row.roll}
              className="border-t border-border/50 hover:bg-accent/20 transition-colors"
            >
              <td className="px-2 py-1.5 text-center font-bold text-muted-foreground">
                {row.roll}
              </td>
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
            <th className="px-2 py-1.5 text-center text-muted-foreground font-medium w-10">
              d10
            </th>
            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">
              Encounter
            </th>
          </tr>
        </thead>
        <tbody>
          {tier.encounters.map((enc) => (
            <tr
              key={enc.roll}
              className="border-t border-border/50 hover:bg-accent/20 transition-colors"
            >
              <td className="px-2 py-1.5 text-center font-bold text-muted-foreground">
                {enc.roll}
              </td>
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
  colors: { accent: string; bg: string; border: string; badge: string };
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

// ── Rules Tab ─────────────────────────────────────────────────────────────

function RulesTab({
  environments,
  onSelect,
}: {
  environments: Environment[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Rules cards */}
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

      {/* Intro paragraph */}
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {ENVIRONMENT_RULES[0].text}
        </p>
      </div>

      {/* Environment quick-select */}
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

// ── Environment Detail (inline) ───────────────────────────────────────────

function EnvironmentDetailInline({
  environment,
}: {
  environment: Environment;
}) {
  const colors =
    ENVIRONMENT_COLORS[environment.name] ?? ENVIRONMENT_COLORS["Verdant Hills"];

  return (
    <div className="space-y-5">
      {/* Biome + Stats */}
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

      {/* Special Rules */}
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
                  {rule.description}
                </p>
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

      {/* Level Tiers */}
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

function EnvironmentRollsTab({ environments }: { environments: Environment[] }) {
  const [selectedEnvironmentName, setSelectedEnvironmentName] = useState(
    environments[0]?.name ?? "",
  );
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [resourceColumnIndex, setResourceColumnIndex] = useState(0);
  const [skillMod, setSkillMod] = useState(0);
  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [history, setHistory] = useState<RollEntry[]>([]);

  const selectedEnvironment =
    environments.find((env) => env.name === selectedEnvironmentName) ?? environments[0] ?? null;

  const tiers = selectedEnvironment?.levelTiers ?? [];
  const selectedTier = tiers[selectedTierIndex] ?? tiers[0];
  const resourceColumns = selectedTier?.resources.columns ?? [];
  const selectedResourceColumn = resourceColumns[resourceColumnIndex] ?? resourceColumns[0];

  function pushHistory(entry: Omit<RollEntry, "id" | "createdAt">) {
    setHistory((prev) => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  }

  function rollNavigationCheck() {
    if (!selectedEnvironment || !selectedTier) return;
    const d20 = rollD20WithMode(rollMode);
    const total = d20.selected + skillMod;
    const success = total >= selectedEnvironment.navigationDC;
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "navigation",
      label: "Navigation Check",
      details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}`,
      result: `Total ${total} vs DC ${selectedEnvironment.navigationDC}`,
      success,
    });
  }

  function rollEncounter() {
    if (!selectedEnvironment || !selectedTier) return;
    const encounterCheck = rollDie(20);
    const triggered = encounterCheck >= selectedEnvironment.encounterDC;
    if (!triggered) {
      pushHistory({
        environmentName: selectedEnvironment.name,
        levelRange: selectedTier.levelRange,
        section: "encounter-check",
        label: "Encounter Check",
        details: `d20 ${encounterCheck} vs Encounter DC ${selectedEnvironment.encounterDC}`,
        result: "No encounter triggered.",
        success: false,
      });
      return;
    }

    const encounterRoll = rollDie(10);
    const encounter = findEncounterByRoll(selectedTier.encounters, encounterRoll);
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "encounter-check",
      label: "Encounter Check",
      details: `d20 ${encounterCheck} >= DC ${selectedEnvironment.encounterDC}; d10 ${encounterRoll}`,
      result: encounter
        ? `Encounter: ${encounter.description}`
        : "Encounter triggered but no matching row was found.",
      success: true,
    });
  }

  function rollWeather() {
    if (!selectedEnvironment || !selectedTier || !selectedEnvironment.weatherTable?.length) return;
    const weatherRoll = rollDie(20);
    const weather = findWeatherByRoll(selectedEnvironment.weatherTable, weatherRoll);
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "weather",
      label: "Weather Roll",
      details: `d20 ${weatherRoll}`,
      result: weather ? weather.weather : "No weather row matched that roll.",
    });
  }

  function rollInvestigation() {
    if (!selectedEnvironment || !selectedTier) return;
    const d20 = rollD20WithMode(rollMode);
    const total = d20.selected + skillMod;
    const success = total >= selectedEnvironment.investigationDC;
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "investigation",
      label: "Investigation Check",
      details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}`,
      result: `Total ${total} vs DC ${selectedEnvironment.investigationDC}`,
      success,
    });
  }

  function rollResources() {
    if (!selectedEnvironment || !selectedTier || !selectedResourceColumn) return;
    const d20 = rollD20WithMode(rollMode);
    const total = d20.selected + skillMod;
    const passResourceCheck = total >= selectedResourceColumn.dc;
    if (!passResourceCheck) {
      pushHistory({
        environmentName: selectedEnvironment.name,
        levelRange: selectedTier.levelRange,
        section: "resources",
        label: `${selectedResourceColumn.category} Resource Check`,
        details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}`,
        result: `Failed: total ${total} vs DC ${selectedResourceColumn.dc}`,
        success: false,
      });
      return;
    }

    const rowRollSeed =
      selectedTier.resources.rows[Math.floor(Math.random() * selectedTier.resources.rows.length)]?.roll ?? "1";
    const d6Result = rollFromRangeLabel(rowRollSeed);
    const row = findResourceRowByRoll(selectedTier.resources.rows, d6Result);
    const item = row?.items[resourceColumnIndex];
    pushHistory({
      environmentName: selectedEnvironment.name,
      levelRange: selectedTier.levelRange,
      section: "resources",
      label: `${selectedResourceColumn.category} Resource Check`,
      details: `d20 ${d20.rolls.join(" / ")} (${d20.mode}) + mod ${skillMod >= 0 ? "+" : ""}${skillMod}; d6 ${d6Result}`,
      result: item
        ? `Success: ${item} (row ${row?.roll ?? "-"})`
        : "Success, but no resource item matched that roll/category.",
      success: true,
    });
  }

  if (!selectedEnvironment || !selectedTier) {
    return <p className="text-sm text-muted-foreground">No environments available.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Dice6 className="h-4 w-4 text-primary" />
          Roll Setup
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            Environment
            <select
              value={selectedEnvironment.name}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedEnvironmentName(next);
                setSelectedTierIndex(0);
                setResourceColumnIndex(0);
              }}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              {environments.map((env) => (
                <option key={env.name} value={env.name}>
                  {env.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            Level Tier
            <select
              value={selectedTierIndex}
              onChange={(e) => {
                setSelectedTierIndex(Number(e.target.value));
                setResourceColumnIndex(0);
              }}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              {selectedEnvironment.levelTiers.map((tier, idx) => (
                <option key={tier.levelRange} value={idx}>
                  {tier.levelRange}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            Skill Modifier
            <input
              type="number"
              value={skillMod}
              onChange={(e) => setSkillMod(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            Roll Mode
            <select
              value={rollMode}
              onChange={(e) => setRollMode(e.target.value as RollMode)}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 pt-1">
          <button
            onClick={rollNavigationCheck}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            Roll Navigation (DC {selectedEnvironment.navigationDC})
          </button>
          <button
            onClick={rollEncounter}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            Roll Encounter Flow
          </button>
          <button
            onClick={rollWeather}
            disabled={!selectedEnvironment.weatherTable?.length}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Roll Weather
          </button>
          <button
            onClick={rollInvestigation}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            Roll Investigation (DC {selectedEnvironment.investigationDC})
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Resource Table Roll
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            Resource Category
            <select
              value={resourceColumnIndex}
              onChange={(e) => setResourceColumnIndex(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              {resourceColumns.map((col, idx) => (
                <option key={col.category} value={idx}>
                  {col.category} (DC {col.dc})
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground flex items-center">
            This check uses your custom modifier and roll mode (normal/adv/disadv).
          </div>
        </div>

        <button
          onClick={rollResources}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
        >
          Roll Resource Check + Loot
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Environment Details Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-md border border-border bg-card/40 p-3">
            <p className="text-xs text-muted-foreground">Special Rules</p>
            <ul className="mt-1 space-y-1">
              {selectedEnvironment.specialRules.length > 0 ? (
                selectedEnvironment.specialRules.map((rule) => (
                  <li key={rule.name} className="text-xs text-foreground">
                    <span className="font-semibold">{rule.name}:</span> {rule.description}
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">No special rules.</li>
              )}
            </ul>
          </div>
          <div className="rounded-md border border-border bg-card/40 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Quick Data</p>
            <p className="text-xs text-foreground">Biome: {selectedEnvironment.biome}</p>
            <p className="text-xs text-foreground">Common Weather: {selectedEnvironment.commonWeather}</p>
            <p className="text-xs text-foreground">Total Resources: {selectedEnvironment.totalResources}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Roll History</h3>
          <button
            onClick={() => setHistory([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear history
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No rolls yet. Start with any roll button to see detailed dice outcomes.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-md border border-border bg-card/40 p-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{entry.createdAt.toLocaleTimeString()}</span>
                  <span>-</span>
                  <span>{entry.environmentName}</span>
                  <span>-</span>
                  <span>{entry.levelRange}</span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {entry.label}
                  {typeof entry.success === "boolean" && (
                    <span className={cn("ml-2", entry.success ? "text-emerald-400" : "text-rose-400")}>
                      {entry.success ? "SUCCESS" : "FAIL"}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{entry.details}</p>
                <p className="text-xs text-foreground">{entry.result}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Search Results ────────────────────────────────────────────────────────

function SearchResultsPanel({
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

// ── Main Component ────────────────────────────────────────────────────────

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
      {/* Header */}
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

      {/* Search */}
      {/* <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search environments, biomes, weather..."
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div> */}

      {isSearching ? (
        <SearchResultsPanel environments={filtered} onSelect={handleSelect} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
            {/* Rules tab */}
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

            {/* One tab per environment */}
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
          {activeTab === "rolls" && <EnvironmentRollsTab environments={allEnvironments} />}
          {activeEnvironment && (
            <EnvironmentDetailInline environment={activeEnvironment} />
          )}
        </>
      )}
    </div>
  );
}
