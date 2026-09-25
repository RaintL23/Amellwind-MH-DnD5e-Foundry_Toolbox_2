import { useEffect, useRef } from "react";
import { Dices, Heart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/shared/utils/cn";
import type { Combatant } from "../utils/combat-tracker.types";
import { getCombatantStatus } from "../utils/combatant-status.utils";
import { DeathSavesPanel } from "./DeathSavesPanel";

interface CombatantRowProps {
  combatant: Combatant;
  isActive: boolean;
  selected: boolean;
  initiativeEditable: boolean;
  onSelectChange: (selected: boolean) => void;
  onInitiativeChange: (value: number | null) => void;
  onRollInitiative: () => void;
  onOpenHp: () => void;
  onRemove: () => void;
  onDeathSaveCount: (side: "successes" | "failures", count: number) => void;
  onRollDeathSave: () => void;
}

function hpPercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (current / max) * 100));
}

export function CombatantRow({
  combatant,
  isActive,
  selected,
  initiativeEditable,
  onSelectChange,
  onInitiativeChange,
  onRollInitiative,
  onOpenHp,
  onRemove,
  onDeathSaveCount,
  onRollDeathSave,
}: CombatantRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const status = getCombatantStatus(combatant);
  const defeated = status === "defeated";
  const showDeathSaves =
    combatant.kind === "pc" && combatant.hp.current <= 0;
  const pct = hpPercent(combatant.hp.current, combatant.hp.max);
  const needsInitRoll = initiativeEditable && combatant.initiative == null;

  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isActive]);

  return (
    <div
      ref={rowRef}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "rounded-md border border-border bg-card px-3 py-2.5 transition-colors",
        isActive && "border-primary bg-primary/10 ring-1 ring-primary/40",
        defeated && "opacity-50 grayscale",
        status === "dead" && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelectChange(v === true)}
          aria-label={`Select ${combatant.name}`}
        />

        <div className="flex shrink-0 items-center gap-1">
          {initiativeEditable ? (
            <Input
              type="number"
              step={0.01}
              className="h-8 w-[5.75rem] px-1 text-center text-xs tabular-nums sm:w-24"
              value={combatant.initiative ?? ""}
              placeholder="—"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onInitiativeChange(null);
                  return;
                }
                const n = Number.parseFloat(raw);
                if (Number.isFinite(n)) {
                  onInitiativeChange(Math.round(n * 100) / 100);
                }
              }}
              aria-label={`Initiative for ${combatant.name}`}
            />
          ) : (
            <span
              className="inline-flex h-8 w-[5.75rem] items-center justify-center rounded-md border border-border bg-muted/30 px-1 text-center text-xs tabular-nums text-foreground sm:w-24"
              aria-label={`Initiative for ${combatant.name}: ${combatant.initiative ?? "none"}`}
            >
              {combatant.initiative != null
                ? combatant.initiative.toFixed(2)
                : "—"}
            </span>
          )}
          {needsInitRoll ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={onRollInitiative}
              aria-label={`Roll initiative for ${combatant.name}`}
              title="Roll initiative"
            >
              <Dices className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "truncate text-sm font-medium text-foreground",
                defeated && "line-through",
              )}
            >
              {combatant.name}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {combatant.kind === "pc" ? "PC" : "NPC"}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {combatant.levelOrCr}
            </span>
            {status === "defeated" ? (
              <span className="sr-only">Defeated</span>
            ) : null}
            {status === "dead" ? (
              <Badge variant="red" className="text-[10px]">
                Dead
              </Badge>
            ) : null}
          </div>
          <p className="text-[10px] text-muted-foreground">
            AC {combatant.ac}
            {combatant.playerName ? ` · ${combatant.playerName}` : null}
          </p>
        </div>

        <div className="w-full space-y-1 sm:w-44">
          {showDeathSaves ? (
            <DeathSavesPanel
              combatant={combatant}
              onSetCount={onDeathSaveCount}
              onRoll={onRollDeathSave}
            />
          ) : (
            <>
              <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
                <span>
                  {combatant.hp.current}/{combatant.hp.max}
                  {combatant.hp.temp > 0 ? ` (+${combatant.hp.temp})` : ""}
                </span>
              </div>
              <Progress
                value={pct}
                className={cn(
                  "h-2",
                  pct > 50
                    ? "[&>div]:!bg-emerald-500"
                    : pct > 25
                      ? "[&>div]:!bg-amber-500"
                      : "[&>div]:!bg-destructive",
                )}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={onOpenHp}
            aria-label={`Adjust HP for ${combatant.name}`}
          >
            <Heart className="mr-1 h-3.5 w-3.5" />
            HP
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onRemove}
            aria-label={`Remove ${combatant.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
