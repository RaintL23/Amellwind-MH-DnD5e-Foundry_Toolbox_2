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
import { FINDING_SIGNS_TABLE } from "../data/hunt-rules.data";
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

  if (!hunt.selectedMonster || !hunt.selectedEnvironment) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Select a monster and environment in the Setup tab to start tracking.
        </AlertDescription>
      </Alert>
    );
  }

  const progressValue = Math.min(
    100,
    (hunt.signsFound / Math.max(hunt.signsRequired, 1)) * 100,
  );

  const trackingHistory = hunt.rollHistory.filter(
    (entry) => entry.section === "tracking",
  );

  return (
    <div className="space-y-5">
      {hunt.monsterFound && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <Target className="h-4 w-4" />
          <AlertTitle>Monster Found!</AlertTitle>
          <AlertDescription>
            The party has found {hunt.signsFound} signs (required:{" "}
            {hunt.signsRequired}). The final battle against{" "}
            {hunt.selectedMonster.name} can begin.
          </AlertDescription>
        </Alert>
      )}

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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Signs found: {hunt.signsFound} / {hunt.signsRequired}
              </span>
              <span>{hunt.selectedMonster.name}</span>
            </div>
            <Progress value={progressValue} />
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="tracker-signs" className="text-xs">
                Signs required
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
              </Label>
            </div>
          </div>

          <Button type="button" onClick={hunt.rollTracking} className="w-full sm:w-auto">
            Roll Finding Signs
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">{FINDING_SIGNS_TABLE.caption}</CardTitle>
          <CardDescription>
            Reference table for GM rolls after the Trailblazer Survival check.
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
