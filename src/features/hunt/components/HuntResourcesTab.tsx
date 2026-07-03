import { useState } from "react";
import { Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { RollMode } from "@/features/environments/utils/environmentRoll.utils";
import type { UseHuntStateResult } from "../hooks/useHuntState";
import { HuntRollHistory } from "./HuntRollHistory";

interface HuntResourcesTabProps {
  hunt: UseHuntStateResult;
}

export function HuntResourcesTab({ hunt }: HuntResourcesTabProps) {
  const [resourceColumnIndex, setResourceColumnIndex] = useState(0);

  if (!hunt.setupComplete) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Complete setup and press Start Hunt before rolling resources.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hunt.selectedEnvironment) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Select an environment in the Setup tab to roll on resource tables.
        </AlertDescription>
      </Alert>
    );
  }

  const resourceColumns = hunt.selectedTier?.resources.columns ?? [];
  const selectedResourceColumn =
    resourceColumns[resourceColumnIndex] ?? resourceColumns[0];

  const resourceHistory = hunt.rollHistory.filter(
    (entry) => entry.section === "resources",
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-primary" />
            Resource Rolls — {hunt.selectedEnvironment.name}
          </CardTitle>
          <CardDescription>
            Uses the environment resource tables for the selected level tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="resource-tier" className="text-xs">
                Level tier
              </Label>
              <Select
                id="resource-tier"
                value={hunt.selectedTierIndex}
                onChange={(e) =>
                  hunt.setSelectedTierIndex(Number(e.target.value))
                }
              >
                {hunt.selectedEnvironment.levelTiers.map((tier, idx) => (
                  <option key={tier.levelRange} value={idx}>
                    Level {tier.levelRange}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resource-category" className="text-xs">
                Resource category
              </Label>
              <Select
                id="resource-category"
                value={resourceColumnIndex}
                onChange={(e) =>
                  setResourceColumnIndex(Number(e.target.value))
                }
              >
                {resourceColumns.map((col, idx) => (
                  <option key={col.category} value={idx}>
                    {col.category} (DC {col.dc})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resource-bonus" className="text-xs">
                Flat bonus
              </Label>
              <Input
                id="resource-bonus"
                type="number"
                value={hunt.flatBonus}
                onChange={(e) => hunt.setFlatBonus(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resource-mode" className="text-xs">
                Roll mode
              </Label>
              <Select
                id="resource-mode"
                value={hunt.rollMode}
                onChange={(e) => hunt.setRollMode(e.target.value as RollMode)}
              >
                <option value="normal">Normal</option>
                <option value="advantage">Advantage</option>
                <option value="disadvantage">Disadvantage</option>
              </Select>
            </div>
          </div>

          {selectedResourceColumn && (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Roll d20 + {hunt.flatBonus >= 0 ? "+" : ""}
              {hunt.flatBonus} vs DC {selectedResourceColumn.dc}. On success,
              roll d6 on the {selectedResourceColumn.category} column.
            </div>
          )}

          <Separator />

          <Button
            type="button"
            onClick={() => hunt.rollResource(resourceColumnIndex)}
            disabled={!selectedResourceColumn}
            className="w-full sm:w-auto"
          >
            Roll Resource Check + Loot
          </Button>
        </CardContent>
      </Card>

      <HuntRollHistory
        title="Resource Roll History"
        entries={resourceHistory}
        onClear={hunt.clearHistory}
      />
    </div>
  );
}
