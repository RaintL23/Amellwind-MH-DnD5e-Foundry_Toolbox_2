import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Dices,
  Loader2,
  Shuffle,
  Skull,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  const [monsterPickerOpen, setMonsterPickerOpen] = useState(false);

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
          <CardContent className="space-y-2 p-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="monster-combobox" className="text-xs">
                Monster
              </Label>
              <Popover
                open={monsterPickerOpen}
                onOpenChange={setMonsterPickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="monster-combobox"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={monsterPickerOpen}
                    disabled={hunt.monstersLoading}
                    className="h-9 w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {hunt.selectedMonster
                        ? `${hunt.selectedMonster.name} (CR ${hunt.selectedMonster.cr})`
                        : "Search monsters..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                >
                  <Command>
                    <CommandInput placeholder="Type a monster name..." />
                    <CommandList>
                      <CommandEmpty>No monster found.</CommandEmpty>
                      <CommandGroup>
                        {hunt.compatibleMonsters.map((monster) => {
                          const selected =
                            hunt.selectedMonster?.name === monster.name;
                          return (
                            <CommandItem
                              key={`${monster.name}-${monster.source}`}
                              value={`${monster.name} CR ${monster.cr}`}
                              onSelect={() => {
                                hunt.pickMonster(monster);
                                setMonsterPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  selected ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="truncate">{monster.name}</span>
                              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                CR {monster.cr}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {hunt.selectedMonster ? (
              <p className="text-xs text-muted-foreground capitalize">
                <span className="normal-case">
                  CR {hunt.selectedMonster.cr}
                  {hunt.selectedMonster.type?.type
                    ? ` · ${hunt.selectedMonster.type.type}`
                    : ""}
                </span>
                {hunt.selectedMonster.environment?.length
                  ? ` · ${hunt.selectedMonster.environment.join(", ")}`
                  : " · No habitat tags"}
              </p>
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
          <CardContent className="space-y-2 p-4 pt-0">
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
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {hunt.selectedEnvironment.biome}
                  {" · "}
                  {getEnvironmentTagsLabel(hunt.selectedEnvironment.name)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Nav {hunt.selectedEnvironment.navigationDC}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Encounter {hunt.selectedEnvironment.encounterDC}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Investigation {hunt.selectedEnvironment.investigationDC}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
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
        <Card
          className={
            hunt.setupComplete
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-primary/20"
          }
        >
          {hunt.setupComplete ? (
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-emerald-400">
                    Hunt setup complete
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tracker and Resources are unlocked. You can still edit prep
                    tables below.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
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
                  disabled
                >
                  <Dices className="h-4 w-4 mr-1.5" />
                  Start Hunt
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <CardDescription className="min-w-0 flex-1">
                Review and edit the generated tables, then confirm to start the
                hunt.
              </CardDescription>
              <div className="flex shrink-0 flex-wrap gap-2">
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
                  disabled={hunt.prepTables.signs.length === 0}
                >
                  <Dices className="h-4 w-4 mr-1.5" />
                  Start Hunt
                </Button>
              </div>
            </CardContent>
          )}
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
