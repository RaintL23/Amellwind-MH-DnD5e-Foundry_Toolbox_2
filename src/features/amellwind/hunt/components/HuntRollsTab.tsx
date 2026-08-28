import { useState } from "react";
import {
  Compass,
  Dice6,
  Eye,
  Footprints,
  Search,
  Swords,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { RollMode } from "@/features/amellwind/environments/utils/environmentRoll.utils";
import type { UseHuntStateResult } from "../hooks/useHuntState";
import { HuntRollHistory } from "./HuntRollHistory";

interface HuntRollsTabProps {
  hunt: UseHuntStateResult;
}

export function HuntRollsTab({ hunt }: HuntRollsTabProps) {
  const [spotterPassivePerception, setSpotterPassivePerception] = useState(10);
  const [spotterPassiveInvestigation, setSpotterPassiveInvestigation] =
    useState(10);

  if (!hunt.setupComplete) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Complete setup and press Start Hunt before using hunt rolls.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hunt.selectedEnvironment || !hunt.selectedTier) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Select an environment in the Setup tab to roll environment checks.
        </AlertDescription>
      </Alert>
    );
  }

  const environmentHistory = hunt.rollHistory.filter(
    (entry) =>
      entry.section === "environment" ||
      entry.section === "scout" ||
      entry.section === "spotter",
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Dice6 className="h-4 w-4 text-primary" />
            Roll Setup
          </CardTitle>
          <CardDescription>
            Shared modifier and roll mode for active skill checks in{" "}
            {hunt.selectedEnvironment.name} (Level {hunt.selectedTier.levelRange}).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 p-4 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="hunt-roll-mod" className="text-xs">
              Skill modifier
            </Label>
            <Input
              id="hunt-roll-mod"
              type="number"
              value={hunt.flatBonus}
              onChange={(e) => hunt.setFlatBonus(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hunt-roll-mode" className="text-xs">
              Roll mode
            </Label>
            <Select
              id="hunt-roll-mode"
              value={hunt.rollMode}
              onChange={(e) => hunt.setRollMode(e.target.value as RollMode)}
            >
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Compass className="h-4 w-4 text-primary" />
            Environment Rolls
          </CardTitle>
          <CardDescription>
            Navigation, encounters, weather, and investigation for the current
            hunt environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={hunt.rollEnvironmentNavigation}
            >
              <Compass className="h-4 w-4 mr-1.5" />
              Navigation (DC {hunt.selectedEnvironment.navigationDC})
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={hunt.rollEnvironmentEncounter}
            >
              <Swords className="h-4 w-4 mr-1.5" />
              Encounter (DC {hunt.selectedEnvironment.encounterDC})
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={hunt.rollEnvironmentWeather}
              disabled={!hunt.selectedEnvironment.weatherTable?.length}
            >
              Weather
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={hunt.rollEnvironmentInvestigation}
            >
              <Search className="h-4 w-4 mr-1.5" />
              Investigation (DC {hunt.selectedEnvironment.investigationDC})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Footprints className="h-4 w-4 text-primary" />
            Scout
          </CardTitle>
          <CardDescription>
            Active Stealth and Perception before the party enters an area.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div className="flex items-center gap-2">
            <Switch
              id="scout-ambush"
              checked={hunt.scoutAmbushSpotNoticed}
              onCheckedChange={hunt.setScoutAmbushSpotNoticed}
            />
            <Label htmlFor="scout-ambush" className="text-xs text-muted-foreground">
              Ambush spot noticed (+4 to Spotter passive Perception)
            </Label>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={hunt.rollScoutStealth}>
              Roll Stealth
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={hunt.rollScoutPerception}
            >
              Roll Perception
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-primary" />
            Spotter
          </CardTitle>
          <CardDescription>
            Passive Perception vs ambush DC and optional passive Investigation vs
            area DC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="spotter-pp" className="text-xs">
                Passive Perception
              </Label>
              <Input
                id="spotter-pp"
                type="number"
                value={spotterPassivePerception}
                onChange={(e) =>
                  setSpotterPassivePerception(Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spotter-pinv" className="text-xs">
                Passive Investigation
              </Label>
              <Input
                id="spotter-pinv"
                type="number"
                value={spotterPassiveInvestigation}
                onChange={(e) =>
                  setSpotterPassiveInvestigation(Number(e.target.value))
                }
              />
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <Eye className="inline h-3.5 w-3.5 mr-1" />
            Ambush DC {hunt.selectedEnvironment.encounterDC}
            {hunt.scoutAmbushSpotNoticed && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                +4 Scout bonus applied
              </Badge>
            )}
            {" · "}
            Investigation DC {hunt.selectedEnvironment.investigationDC}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                hunt.checkSpotterPerception(spotterPassivePerception)
              }
            >
              Check Passive Perception
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                hunt.checkSpotterInvestigation(spotterPassiveInvestigation)
              }
            >
              Check Passive Investigation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <HuntRollHistory
        title="Hunt Rolls History"
        entries={environmentHistory}
        onClear={hunt.clearHistory}
      />
    </div>
  );
}
