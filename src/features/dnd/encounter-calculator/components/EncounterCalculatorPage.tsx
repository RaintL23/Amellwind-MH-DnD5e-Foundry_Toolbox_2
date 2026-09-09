import { useMemo, useState } from "react";
import { Skull, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NumberStepper } from "@/shared/components/NumberStepper";
import { cn } from "@/shared/utils/cn";
import { ENCOUNTER_DIFFICULTY_BADGE_CLASS } from "../data/encounter-xp.data";
import {
  createCreatureId,
  getEncounterDifficulty,
  type EncounterCreatureInput,
} from "../utils/encounter-difficulty.utils";
import { EncounterBuilderPanel } from "./EncounterBuilderPanel";

function createPartyLevels(count: number, level: number): number[] {
  return Array.from({ length: count }, () => level);
}

function clampLevel(level: number): number {
  return Math.min(20, Math.max(1, level));
}

function averagePartyLevel(levels: number[]): number {
  if (levels.length === 0) return 5;
  const sum = levels.reduce((total, level) => total + level, 0);
  return clampLevel(Math.round(sum / levels.length));
}

export function EncounterCalculatorPage() {
  const [partySize, setPartySize] = useState(4);
  const [useApl, setUseApl] = useState(true);
  const [apl, setApl] = useState(5);
  const [partyLevels, setPartyLevels] = useState(() => createPartyLevels(4, 5));
  const [creatures, setCreatures] = useState<EncounterCreatureInput[]>([]);

  const result = useMemo(
    () => getEncounterDifficulty(partyLevels, creatures),
    [partyLevels, creatures],
  );

  function handlePartySizeChange(size: number) {
    const clamped = Math.min(8, Math.max(1, size));
    setPartySize(clamped);
    setPartyLevels((prev) => {
      if (useApl) return createPartyLevels(clamped, apl);
      if (clamped <= prev.length) return prev.slice(0, clamped);
      return [
        ...prev,
        ...Array.from({ length: clamped - prev.length }, () => 5),
      ];
    });
  }

  function handleUseAplChange(checked: boolean) {
    setUseApl(checked);
    if (checked) {
      const nextApl = averagePartyLevel(partyLevels);
      setApl(nextApl);
      setPartyLevels(createPartyLevels(partySize, nextApl));
      return;
    }
    setPartyLevels(createPartyLevels(partySize, apl));
  }

  function handleAplChange(level: number) {
    const clamped = clampLevel(level);
    setApl(clamped);
    setPartyLevels(createPartyLevels(partySize, clamped));
  }

  function setPartyLevel(index: number, level: number) {
    const clamped = clampLevel(level);
    setPartyLevels((prev) =>
      prev.map((value, idx) => (idx === index ? clamped : value)),
    );
  }

  function addCreature(creature: Omit<EncounterCreatureInput, "id">) {
    setCreatures((prev) => [...prev, { ...creature, id: createCreatureId() }]);
  }

  function updateCreature(id: string, patch: Partial<EncounterCreatureInput>) {
    setCreatures((prev) =>
      prev.map((creature) =>
        creature.id === id ? { ...creature, ...patch } : creature,
      ),
    );
  }

  function removeCreature(id: string) {
    setCreatures((prev) => prev.filter((creature) => creature.id !== id));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <Skull className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Encounter Calculator
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Estimate D&amp;D 5e encounter difficulty using official DMG XP
              thresholds and monster multipliers. Compare adjusted XP against
              your party&apos;s easy, medium, hard, and deadly budgets.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                Party
              </CardTitle>
              <CardDescription>
                Set party size, then use one APL for everyone or per-character
                levels (1–20).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <Switch
                  id="use-apl"
                  checked={useApl}
                  onCheckedChange={handleUseAplChange}
                />
                <Label
                  htmlFor="use-apl"
                  className="flex flex-1 cursor-pointer flex-col gap-0.5"
                >
                  <span className="text-xs font-medium text-foreground">
                    Use average party level (APL)
                  </span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {useApl
                      ? "One level for the whole party — turn off to set each PC"
                      : "Per-character levels — turn on to apply one APL to all"}
                  </span>
                </Label>
              </div>
              <div
                className={cn(
                  "grid gap-3",
                  useApl ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Party size</Label>
                  <NumberStepper
                    value={partySize}
                    min={1}
                    max={8}
                    onChange={handlePartySizeChange}
                  />
                </div>
                {useApl ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Average party level (APL)</Label>
                    <NumberStepper
                      value={apl}
                      min={1}
                      max={20}
                      onChange={handleAplChange}
                      ariaLabel="APL"
                    />
                  </div>
                ) : null}
              </div>
              {!useApl ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {partyLevels.map((level, index) => (
                    <div key={index} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        PC {index + 1}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={level}
                        onChange={(e) =>
                          setPartyLevel(index, Number(e.target.value))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm">Difficulty Result</CardTitle>
              <CardDescription>
                Based on DMG adjusted XP vs summed party thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-sm",
                    ENCOUNTER_DIFFICULTY_BADGE_CLASS[result.rating],
                  )}
                >
                  {result.label}
                </Badge>
                <Badge variant="outline">{result.adjustedXp} adjusted XP</Badge>
                <Badge variant="outline">{result.monsterCount} monsters</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {result.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                  <p className="text-muted-foreground">Easy</p>
                  <p className="font-medium text-foreground">
                    {result.budget.easy}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                  <p className="text-muted-foreground">Medium</p>
                  <p className="font-medium text-foreground">
                    {result.budget.medium}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                  <p className="text-muted-foreground">Hard</p>
                  <p className="font-medium text-foreground">
                    {result.budget.hard}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                  <p className="text-muted-foreground">Deadly</p>
                  <p className="font-medium text-foreground">
                    {result.budget.deadly}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Base XP {result.totalXp} × multiplier {result.multiplier}
              </p>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <EncounterBuilderPanel
              creatures={creatures}
              onAddCreature={addCreature}
              onUpdateCreature={updateCreature}
              onRemoveCreature={removeCreature}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
