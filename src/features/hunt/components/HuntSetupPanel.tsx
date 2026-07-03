import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Dices,
  Loader2,
  Shuffle,
  Skull,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ENVIRONMENT_COLORS } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { BIOME_ICONS } from "@/features/environments/constants/environment.constants";
import { HUNT_ENCOUNTER_DIFFICULTY_LABELS } from "../utils/hunt-prep-generator.utils";
import { getEnvironmentTagsLabel } from "../utils/hunt-roll.utils";
import type { UseHuntStateResult } from "../hooks/useHuntState";
import { HuntPrepTablesPanel } from "./HuntPrepTablesPanel";

interface HuntSetupPanelProps {
  hunt: UseHuntStateResult;
}

export function HuntSetupPanel({ hunt }: HuntSetupPanelProps) {
  const [monsterSearch, setMonsterSearch] = useState("");

  const filteredMonsters = useMemo(() => {
    const pool = hunt.compatibleMonsters;
    const query = monsterSearch.trim().toLowerCase();
    if (!query) return pool;
    return pool.filter((monster) => monster.name.toLowerCase().includes(query));
  }, [hunt.compatibleMonsters, monsterSearch]);

  return (
    <div className="space-y-5">
      <Card className="shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 p-4 pb-3">
          <div>
            <CardTitle className="text-sm">Quick actions</CardTitle>
            <CardDescription>
              Randomize picks or reset the entire hunt session.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={hunt.randomize}
            >
              <Shuffle className="h-4 w-4 mr-1.5" />
              Randomize missing picks
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={hunt.resetHunt}
            >
              Reset hunt
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Skull className="h-4 w-4 text-primary" />
              Target Monster
            </CardTitle>
            <CardDescription>
              {hunt.compatibleMonsters.length} compatible monsters for your data
              sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="monster-search" className="text-xs">
                Search
              </Label>
              <Input
                id="monster-search"
                value={monsterSearch}
                onChange={(e) => setMonsterSearch(e.target.value)}
                placeholder="Filter monsters..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="monster-select" className="text-xs">
                Monster
              </Label>
              <Select
                id="monster-select"
                value={hunt.selectedMonster?.name ?? ""}
                onChange={(e) => {
                  const name = e.target.value;
                  if (!name) {
                    hunt.pickMonster(null);
                    return;
                  }
                  const monster =
                    hunt.monsters.find((m) => m.name === name) ?? null;
                  hunt.pickMonster(monster);
                }}
                disabled={hunt.monstersLoading}
              >
                <option value="">— Choose monster —</option>
                {filteredMonsters.map((monster) => (
                  <option
                    key={`${monster.name}-${monster.source}`}
                    value={monster.name}
                  >
                    {monster.name} (CR {monster.cr})
                  </option>
                ))}
              </Select>
            </div>

            {hunt.selectedMonster ? (
              <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1 text-xs">
                <p className="text-foreground font-semibold">
                  {hunt.selectedMonster.name}
                </p>
                <p className="text-muted-foreground">
                  CR {hunt.selectedMonster.cr}
                  {hunt.selectedMonster.type?.type
                    ? ` · ${hunt.selectedMonster.type.type}`
                    : ""}
                </p>
                {hunt.selectedMonster.environment?.length ? (
                  <p className="text-muted-foreground capitalize">
                    Habitats: {hunt.selectedMonster.environment.join(", ")}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    No habitat tags listed.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Pick a monster or use randomize.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              Hunt Environment
            </CardTitle>
            <CardDescription>
              {hunt.compatibleEnvironments.length} environments match the
              selected monster habitats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="environment-select" className="text-xs">
                Environment
              </Label>
              <Select
                id="environment-select"
                value={hunt.selectedEnvironment?.name ?? ""}
                onChange={(e) => {
                  const name = e.target.value;
                  if (!name) {
                    hunt.pickEnvironment(null);
                    return;
                  }
                  const environment =
                    hunt.environments.find((env) => env.name === name) ?? null;
                  hunt.pickEnvironment(environment);
                }}
              >
                <option value="">— Choose environment —</option>
                {hunt.compatibleEnvironments.map((environment) => (
                  <option key={environment.name} value={environment.name}>
                    {BIOME_ICONS[environment.name] ?? "📍"} {environment.name}
                  </option>
                ))}
              </Select>
            </div>

            {hunt.selectedEnvironment ? (
              <div
                className={cn(
                  "rounded-md border p-3 space-y-2 text-xs",
                  ENVIRONMENT_COLORS[hunt.selectedEnvironment.name]?.border ??
                    "border-border",
                  ENVIRONMENT_COLORS[hunt.selectedEnvironment.name]?.bg ??
                    "bg-muted/20",
                )}
              >
                <p className="text-foreground font-semibold">
                  {hunt.selectedEnvironment.name}
                </p>
                <p className="text-muted-foreground">
                  {hunt.selectedEnvironment.biome}
                </p>
                <p className="text-muted-foreground">
                  Mapped tags:{" "}
                  {getEnvironmentTagsLabel(hunt.selectedEnvironment.name)}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline">
                    Nav DC {hunt.selectedEnvironment.navigationDC}
                  </Badge>
                  <Badge variant="outline">
                    Encounter DC {hunt.selectedEnvironment.encounterDC}
                  </Badge>
                  <Badge variant="outline">
                    Investigation DC {hunt.selectedEnvironment.investigationDC}
                  </Badge>
                  <Badge variant="outline">
                    Resources {hunt.selectedEnvironment.totalResources}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Pick an environment or use randomize.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {hunt.hasBaseSetup && (
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Hunt Parameters
            </CardTitle>
            <CardDescription>
              Tune party tier, encounter difficulty, and signs required before
              generating prep tables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tier-select" className="text-xs">
                  Party level tier
                </Label>
                <Select
                  id="tier-select"
                  value={hunt.selectedTierIndex}
                  onChange={(e) =>
                    hunt.setSelectedTierIndex(Number(e.target.value))
                  }
                >
                  {hunt.selectedEnvironment?.levelTiers.map((tier, idx) => (
                    <option key={tier.levelRange} value={idx}>
                      Level {tier.levelRange}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="difficulty-select" className="text-xs">
                  Encounter difficulty
                </Label>
                <Select
                  id="difficulty-select"
                  value={hunt.encounterDifficulty}
                  onChange={(e) =>
                    hunt.setEncounterDifficulty(
                      e.target.value as typeof hunt.encounterDifficulty,
                    )
                  }
                >
                  {(
                    Object.entries(HUNT_ENCOUNTER_DIFFICULTY_LABELS) as Array<
                      [typeof hunt.encounterDifficulty, string]
                    >
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signs-select" className="text-xs">
                  Signs to find
                </Label>
                <Select
                  id="signs-select"
                  value={hunt.signsRequired}
                  onChange={(e) =>
                    hunt.setSignsRequired(Number(e.target.value))
                  }
                >
                  <option value={3}>3 signs</option>
                  <option value={4}>4 signs</option>
                  <option value={5}>5 signs</option>
                </Select>
              </div>
            </div>

            {hunt.selectedTier && (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground font-medium">
                    Common small:
                  </span>{" "}
                  {hunt.selectedTier.commonSmallMonsters}
                </p>
                <p>
                  <span className="text-foreground font-medium">
                    Common large:
                  </span>{" "}
                  {hunt.selectedTier.commonLargeMonsters}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hunt.hasBaseSetup && !hunt.prepGenerating && (
        <Card className="border-primary/20">
          <CardHeader className="p-4 pb-2">
            {hunt.setupComplete ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <AlertTitle className="text-emerald-400">
                  Hunt setup complete
                </AlertTitle>
                <AlertDescription>
                  Tracker and Resources are unlocked. You can still edit prep
                  tables below.
                </AlertDescription>
              </Alert>
            ) : (
              <CardDescription>
                Review and edit the generated tables, then confirm to start the
                hunt.
              </CardDescription>
            )}
          </CardHeader>
          <CardFooter className="flex flex-wrap justify-end gap-2 p-4 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={hunt.regeneratePrepTables}
            >
              Regenerate tables
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={hunt.completeSetup}
              disabled={
                hunt.setupComplete || hunt.prepTables.signs.length === 0
              }
            >
              <Dices className="h-4 w-4 mr-1.5" />
              Start Hunt
            </Button>
          </CardFooter>
        </Card>
      )}

      {!hunt.hasBaseSetup && (
        <Alert>
          <AlertDescription className="text-muted-foreground">
            Select a target monster and environment to generate contextual prep
            tables.
          </AlertDescription>
        </Alert>
      )}

      {hunt.hasBaseSetup && hunt.prepGenerating && (
        <Alert className="border-border bg-muted/20">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Generating hunt prep tables for {hunt.selectedMonster?.name} in{" "}
            {hunt.selectedEnvironment?.name}...
          </AlertDescription>
        </Alert>
      )}

      {hunt.hasBaseSetup && !hunt.prepGenerating && (
        <>
          <Separator />
          <HuntPrepTablesPanel hunt={hunt} />
        </>
      )}

      {hunt.setupComplete && (
        <p className="text-xs text-muted-foreground">
          Need a full stat block for a friendly NPC benefit? Open the{" "}
          <Link to="/npc-generator" className="text-primary hover:underline">
            NPC Generator
          </Link>
          .
        </p>
      )}
    </div>
  );
}
