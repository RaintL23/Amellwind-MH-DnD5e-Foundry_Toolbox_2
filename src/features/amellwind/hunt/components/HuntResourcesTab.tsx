import { useEffect, useState } from "react";
import { Package } from "lucide-react";
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
import { ResourceDetailDialog } from "@/features/amellwind/resources/components/ResourceDetailDialog";
import { getResourceByName } from "@/features/amellwind/resources/services/resource.service";
import { RESOURCE_CATEGORY_ICONS, type Resource } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import type { RollMode } from "@/features/amellwind/environments/utils/environmentRoll.utils";
import type { UseHuntStateResult } from "../hooks/useHuntState";
import { HuntRollHistory } from "./HuntRollHistory";

interface HuntResourcesTabProps {
  hunt: UseHuntStateResult;
}

function formatBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

export function HuntResourcesTab({ hunt }: HuntResourcesTabProps) {
  const [resourceColumnIndex, setResourceColumnIndex] = useState(0);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const resourceColumns = hunt.selectedTier?.resources.columns ?? [];
  const resourceRows = hunt.selectedTier?.resources.rows ?? [];
  const selectedResourceColumn =
    resourceColumns[resourceColumnIndex] ?? resourceColumns[0];
  const effectiveColumnIndex = selectedResourceColumn
    ? resourceColumns.indexOf(selectedResourceColumn)
    : 0;

  useEffect(() => {
    setResourceColumnIndex((prev) =>
      resourceColumns.length === 0 || prev >= resourceColumns.length
        ? 0
        : prev,
    );
  }, [resourceColumns.length, hunt.selectedTier?.levelRange]);

  if (!hunt.setupComplete) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Complete setup and press Start Hunt before rolling resources.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hunt.selectedEnvironment || !hunt.selectedTier) {
    return (
      <Alert>
        <AlertDescription className="text-muted-foreground">
          Select an environment in the Setup tab to roll on resource tables.
        </AlertDescription>
      </Alert>
    );
  }

  const resourceHistory = hunt.rollHistory.filter(
    (entry) => entry.section === "resources",
  );

  const categoryOptions = resourceRows.map((row) => ({
    roll: row.roll,
    item: row.items[effectiveColumnIndex] ?? "—",
  }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-primary" />
            Resource Rolls — {hunt.selectedEnvironment.name}
            <Badge variant="outline" className="font-normal">
              Level {hunt.selectedTier.levelRange}
            </Badge>
          </CardTitle>
          <CardDescription>
            Uses the environment resource tables for the party level tier set in
            Setup. Change category to preview possible loot, then roll a resource
            check.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="resource-category" className="text-xs">
                Resource category
              </Label>
              <Select
                id="resource-category"
                value={effectiveColumnIndex}
                onChange={(e) =>
                  setResourceColumnIndex(Number(e.target.value))
                }
              >
                {resourceColumns.map((col, idx) => (
                  <option key={col.category} value={idx}>
                    {RESOURCE_CATEGORY_ICONS[col.category] ?? ""}{" "}
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
              Roll d20 {formatBonus(hunt.flatBonus)} vs DC{" "}
              {selectedResourceColumn.dc}. On success, roll d6 on the{" "}
              {selectedResourceColumn.category} column.
            </div>
          )}

          {selectedResourceColumn && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-foreground">
                  {RESOURCE_CATEGORY_ICONS[selectedResourceColumn.category] ??
                    ""}{" "}
                  {selectedResourceColumn.category} options
                </p>
                <Badge variant="outline" className="text-[10px] font-normal">
                  DC {selectedResourceColumn.dc}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {categoryOptions.length} outcomes
                </Badge>
              </div>

              {categoryOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No resource outcomes for this tier.
                </p>
              ) : (
                <ul className="space-y-2">
                  {categoryOptions.map((option) => {
                    const resource = getResourceByName(
                      option.item,
                      selectedResourceColumn.category,
                    );
                    const content = (
                      <>
                        <span className="w-6 shrink-0 text-center text-[11px] font-semibold text-muted-foreground">
                          {option.roll}
                        </span>
                        <span className="min-w-0 flex-1 text-xs text-foreground">
                          {option.item}
                        </span>
                      </>
                    );

                    if (!resource) {
                      return (
                        <li
                          key={option.roll}
                          className="flex items-center gap-2 rounded-md border border-border bg-muted/10 px-3 py-2"
                        >
                          {content}
                        </li>
                      );
                    }

                    return (
                      <li key={option.roll}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedResource(resource);
                            setDialogOpen(true);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md border border-border bg-muted/10 px-3 py-2 text-left",
                            "transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          )}
                        >
                          {content}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <Separator />

          <Button
            type="button"
            onClick={() => hunt.rollResource(effectiveColumnIndex)}
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

      <ResourceDetailDialog
        resource={selectedResource}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
