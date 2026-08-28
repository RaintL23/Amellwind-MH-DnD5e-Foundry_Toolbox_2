import { Footprints, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/shared/utils/cn";
import { getCarveDc } from "@/shared/utils/cr.utils";
import { FINDING_SIGNS_TABLE } from "../data/hunt-rules.data";
import { getMonsterKey } from "../utils/hunt-party.utils";
import type { UseHuntStateResult } from "../hooks/useHuntState";
import { HuntRollHistory } from "./HuntRollHistory";
import { HuntRuleTableView } from "./HuntRuleTable";

interface HuntTrackerTabProps {
  hunt: UseHuntStateResult;
}

const EVENT_BADGE_CLASS: Record<string, string> = {
  "major-challenge": "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "minor-challenge": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "sign-minor-challenge": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  sign: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "signs-benefit": "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export function HuntTrackerTab({ hunt }: HuntTrackerTabProps) {
  if (!hunt.setupComplete) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Complete setup and press Start Hunt before tracking.
        </AlertDescription>
      </Alert>
    );
  }

  if (hunt.selectedMonsters.length === 0 || !hunt.selectedEnvironment) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Select monsters and an environment in the Setup tab to start tracking.
        </AlertDescription>
      </Alert>
    );
  }

  const activeKey =
    hunt.activeTrackingTargetKey ?? getMonsterKey(hunt.selectedMonsters[0]);
  const activeMonster = hunt.selectedMonsters.find(
    (monster) => getMonsterKey(monster) === activeKey,
  );
  const dieMax = hunt.survivalSucceeded ? 20 : 10;
  const manualRollInvalid =
    hunt.trackingRollMode === "manual" &&
    (hunt.manualFindingSignsRoll == null ||
      hunt.manualFindingSignsRoll < 1 ||
      hunt.manualFindingSignsRoll > dieMax);

  const trackingHistory = hunt.rollHistory.filter(
    (entry) => entry.section === "tracking",
  );

  return (
    <div className="space-y-5">
      {hunt.allMonstersFound && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <Target className="h-4 w-4" />
          <AlertTitle>All Targets Found!</AlertTitle>
          <AlertDescription>
            Every quarry has reached the required sign count. Final battles can
            begin.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {hunt.selectedMonsters.map((monster) => {
          const key = getMonsterKey(monster);
          const progress = hunt.targetProgress[key] ?? {
            signsFound: 0,
            found: false,
          };
          const progressValue = Math.min(
            100,
            (progress.signsFound / Math.max(hunt.signsRequired, 1)) * 100,
          );
          return (
            <Card
              key={key}
              className={cn(
                progress.found && "border-emerald-500/30 bg-emerald-500/5",
              )}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{monster.name}</CardTitle>
                  {progress.found ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      Found
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      CR {monster.cr}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Carve DC {getCarveDc(String(monster.cr))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Signs: {progress.signsFound} / {hunt.signsRequired}
                  </span>
                </div>
                <Progress value={progressValue} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 p-4 pb-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Footprints className="h-4 w-4 text-primary" />
              Tracking Progress
            </CardTitle>
            <CardDescription>
              Roll when the Trailblazer enters a new area in{" "}
              {hunt.selectedEnvironment.name}.
            </CardDescription>
          </div>
          <Badge variant="outline">Areas visited: {hunt.areasVisited}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tracker-target" className="text-xs">
                Rolling signs for
              </Label>
              <Select
                id="tracker-target"
                value={activeKey}
                onChange={(e) => hunt.setActiveTrackingTargetKey(e.target.value)}
              >
                {hunt.selectedMonsters.map((monster) => {
                  const key = getMonsterKey(monster);
                  const progress = hunt.targetProgress[key];
                  const found = progress?.found ?? false;
                  return (
                    <option key={key} value={key} disabled={found}>
                      {monster.name}
                      {found ? " (found)" : ""}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tracker-signs" className="text-xs">
                Signs required (each target)
              </Label>
              <Select
                id="tracker-signs"
                value={hunt.signsRequired}
                onChange={(e) => hunt.setSignsRequired(Number(e.target.value))}
              >
                <option value={3}>3 signs</option>
                <option value={4}>4 signs</option>
                <option value={5}>5 signs</option>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="tracker-roll-mode" className="text-xs">
                Finding Signs roll
              </Label>
              <Select
                id="tracker-roll-mode"
                value={hunt.trackingRollMode}
                onChange={(e) =>
                  hunt.setTrackingRollMode(
                    e.target.value as typeof hunt.trackingRollMode,
                  )
                }
              >
                <option value="random">Random d{dieMax}</option>
                <option value="manual">Manual result</option>
              </Select>
            </div>

            {hunt.trackingRollMode === "manual" && (
              <div className="space-y-1.5">
                <Label htmlFor="tracker-manual-roll" className="text-xs">
                  Manual d{dieMax} result
                </Label>
                <Input
                  id="tracker-manual-roll"
                  type="number"
                  min={1}
                  max={dieMax}
                  value={hunt.manualFindingSignsRoll ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    hunt.setManualFindingSignsRoll(
                      value === "" ? null : Number(value),
                    );
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tracker-bonus" className="text-xs">
                Flat bonus
              </Label>
              <Input
                id="tracker-bonus"
                type="number"
                value={hunt.flatBonus}
                onChange={(e) => hunt.setFlatBonus(Number(e.target.value))}
              />
            </div>

            <div className="flex items-end gap-2 pb-1 lg:col-span-2">
              <Switch
                id="survival-success"
                checked={hunt.survivalSucceeded}
                onCheckedChange={hunt.setSurvivalSucceeded}
              />
              <Label
                htmlFor="survival-success"
                className="text-xs leading-snug text-muted-foreground"
              >
                Trailblazer Survival success (d20 vs d10 on Finding Signs Table)
                {activeMonster && (
                  <>
                    {" "}
                    · Carve DC {getCarveDc(String(activeMonster.cr))}
                  </>
                )}
              </Label>
            </div>
          </div>

          {manualRollInvalid && (
            <p className="text-xs text-amber-400">
              Enter a manual roll between 1 and {dieMax} before rolling.
            </p>
          )}

          <Button
            type="button"
            onClick={hunt.rollTracking}
            disabled={manualRollInvalid || activeMonster == null}
            className="w-full sm:w-auto"
          >
            Roll Finding Signs
            {activeMonster ? ` for ${activeMonster.name}` : ""}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">{FINDING_SIGNS_TABLE.caption}</CardTitle>
          <CardDescription>
            Reference table for GM rolls after the Trailblazer Survival check.
            Prep table picks stay random.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <HuntRuleTableView table={FINDING_SIGNS_TABLE} />
        </CardContent>
      </Card>

      <HuntRollHistory
        title="Tracking Roll History"
        entries={trackingHistory}
        onClear={hunt.clearHistory}
        renderBadge={(entry) =>
          entry.eventType ? (
            <Badge
              variant="outline"
              className={cn("text-[10px]", EVENT_BADGE_CLASS[entry.eventType])}
            >
              {entry.eventType.replace(/-/g, " ")}
            </Badge>
          ) : null
        }
      />
    </div>
  );
}
