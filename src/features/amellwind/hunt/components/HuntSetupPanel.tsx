import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Dices,
  Heart,
  Loader2,
  Shuffle,
  Skull,
  MapPin,
  SlidersHorizontal,
  Users,
  X,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { NumberStepper } from "@/shared/components/NumberStepper";
import { cn } from "@/shared/utils/cn";
import { BIOME_ICONS } from "@/features/amellwind/environments/constants/environment.constants";
import { HUNT_ENCOUNTER_DIFFICULTY_LABELS } from "../utils/hunt-prep-generator.utils";
import {
  getMonsterKey,
  getScaledBossHp,
  HUNT_DIFFICULTY_BADGE_CLASS,
} from "../utils/hunt-party.utils";
import { getEnvironmentTagsLabel } from "../utils/hunt-roll.utils";
import type { UseHuntStateResult } from "../hooks/useHuntState";
import { HuntPrepTablesPanel } from "./HuntPrepTablesPanel";

interface HuntSetupPanelProps {
  hunt: UseHuntStateResult;
}

export function HuntSetupPanel({ hunt }: HuntSetupPanelProps) {
  const [monsterPickerOpen, setMonsterPickerOpen] = useState(false);

  const selectedMonsterKeys = new Set(
    hunt.selectedMonsters.map((monster) => getMonsterKey(monster)),
  );

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
              Target Monsters
            </CardTitle>
            <CardDescription>
              Add one or more quarry monsters. Each target tracks signs
              separately during the hunt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="monster-combobox" className="text-xs">
                Add monster
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
                    <span className="truncate text-muted-foreground">
                      Search monsters to add...
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
                          const key = getMonsterKey(monster);
                          const selected = selectedMonsterKeys.has(key);
                          return (
                            <CommandItem
                              key={key}
                              value={`${monster.name} CR ${monster.cr}`}
                              onSelect={() => {
                                if (!selected) hunt.addMonster(monster);
                                setMonsterPickerOpen(false);
                              }}
                              disabled={selected}
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

            {hunt.selectedMonsters.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Total CR {hunt.totalTargetCr}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {hunt.selectedMonsters.length} target
                    {hunt.selectedMonsters.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {hunt.selectedMonsters.map((monster) => {
                    const key = getMonsterKey(monster);
                    return (
                      <li
                        key={key}
                        className="flex items-start gap-2 rounded-md border border-border bg-muted/10 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {monster.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            CR {monster.cr}
                            {monster.type?.type ? ` · ${monster.type.type}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          CR {monster.cr}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => hunt.removeMonster(key)}
                          aria-label={`Remove ${monster.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Add at least one target monster or use randomize.
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
              {hunt.compatibleEnvironments.length} environments match all
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
        <>
          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                Hunting Party
              </CardTitle>
              <CardDescription>
                Set hunter count and levels to calculate average party level and
                compare against total quarry CR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Number of hunters</Label>
                  <NumberStepper
                    value={hunt.hunterCount}
                    min={1}
                    max={6}
                    onChange={hunt.setHunterCount}
                  />
                </div>
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">APL</span>
                    <Badge variant="outline">{hunt.averagePartyLevel}</Badge>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <Badge variant="outline">CR {hunt.totalTargetCr}</Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        HUNT_DIFFICULTY_BADGE_CLASS[hunt.combatDifficulty.rating],
                      )}
                    >
                      {hunt.combatDifficulty.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {hunt.combatDifficulty.description}
                  </p>
                  {hunt.combatDifficulty.tierNote && (
                    <p className="text-[11px] text-amber-400">
                      {hunt.combatDifficulty.tierNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {hunt.hunterLevels.map((level, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Hunter {index + 1}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={level}
                      onChange={(e) =>
                        hunt.setHunterLevel(index, Number(e.target.value))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-primary" />
                Scaled Boss HP
              </CardTitle>
              <CardDescription>
                Amellwind solo-boss scaling: 3 PCs max HP, 4 PCs +50%, 5 PCs ×2.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {hunt.selectedMonsters.map((monster) => {
                const scaled = getScaledBossHp(monster, hunt.hunterCount);
                return (
                  <div
                    key={getMonsterKey(monster)}
                    className="rounded-md border border-border bg-muted/10 px-3 py-2 text-xs"
                  >
                    <p className="font-medium text-foreground">{monster.name}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground">
                      {scaled.averageHp != null && (
                        <span>Avg HP {scaled.averageHp}</span>
                      )}
                      {scaled.baseMaxHp != null && (
                        <span>Max HP {scaled.baseMaxHp}</span>
                      )}
                      {scaled.scaledHp != null && (
                        <span className="text-primary font-medium">
                          Scaled HP {scaled.scaledHp}
                        </span>
                      )}
                      {scaled.multiplierLabel && (
                        <Badge variant="outline" className="text-[10px]">
                          {scaled.multiplierLabel}
                        </Badge>
                      )}
                    </div>
                    {scaled.note && (
                      <p className="mt-1 text-[11px] text-muted-foreground italic">
                        {scaled.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

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
                    Signs per target
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
        </>
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
                    Tracker, Hunt Rolls, and Resources are unlocked.
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
            Select at least one target monster and an environment to generate
            contextual prep tables.
          </AlertDescription>
        </Alert>
      )}

      {hunt.hasBaseSetup && hunt.prepGenerating && (
        <Alert className="border-border bg-muted/20">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Generating hunt prep tables for{" "}
            {hunt.selectedMonsters.map((m) => m.name).join(", ")} in{" "}
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
