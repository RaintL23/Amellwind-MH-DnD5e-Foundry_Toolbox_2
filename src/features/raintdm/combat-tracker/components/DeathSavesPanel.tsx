import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/cn";
import type { Combatant } from "../utils/combat-tracker.types";
import { getCombatantStatus } from "../utils/combatant-status.utils";

interface DeathSavesPanelProps {
  combatant: Combatant;
  onSetCount: (side: "successes" | "failures", count: number) => void;
  onRoll: () => void;
}

function SaveBoxes({
  label,
  count,
  onChange,
  tone,
}: {
  label: string;
  count: number;
  onChange: (count: number) => void;
  tone: "success" | "failure";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "w-14 text-[10px] font-medium uppercase tracking-wide",
          tone === "success" ? "text-emerald-600" : "text-destructive",
        )}
      >
        {label}
      </span>
      <div className="flex gap-1">
        {[1, 2, 3].map((n) => {
          const checked = count >= n;
          return (
            <Checkbox
              key={n}
              checked={checked}
              onCheckedChange={(v) => {
                if (v === true) onChange(n);
                else onChange(n - 1);
              }}
              aria-label={`${label} ${n}`}
              className={cn(
                tone === "failure" &&
                  "data-[state=checked]:border-destructive data-[state=checked]:bg-destructive",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function DeathSavesPanel({
  combatant,
  onSetCount,
  onRoll,
}: DeathSavesPanelProps) {
  const status = getCombatantStatus(combatant);
  const statusLabel =
    status === "dead"
      ? "Dead"
      : status === "stable"
        ? "Stable"
        : "Unconscious";

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            status === "dead" && "border-destructive text-destructive",
            status === "stable" && "border-emerald-600 text-emerald-600",
            status === "dying" && "border-amber-600 text-amber-700",
          )}
        >
          {statusLabel}
        </Badge>
        <Label className="text-[10px] text-muted-foreground">
          Death Saving Throws
        </Label>
        {combatant.lastDeathSaveRoll != null ? (
          <span className="text-[10px] tabular-nums text-muted-foreground">
            Last roll: {combatant.lastDeathSaveRoll}
          </span>
        ) : null}
      </div>
      <SaveBoxes
        label="Success"
        count={combatant.deathSaves.successes}
        onChange={(count) => onSetCount("successes", count)}
        tone="success"
      />
      <SaveBoxes
        label="Failure"
        count={combatant.deathSaves.failures}
        onChange={(count) => onSetCount("failures", count)}
        tone="failure"
      />
      {status === "dying" ? (
        <Button type="button" size="sm" variant="secondary" onClick={onRoll}>
          Roll Save (d20)
        </Button>
      ) : null}
    </div>
  );
}
