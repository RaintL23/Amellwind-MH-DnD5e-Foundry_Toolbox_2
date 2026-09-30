import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { getCalculatorLabels } from "../utils/calculator-labels";
import type { WeaponDamageResult, WeaponSetup } from "../types/damage-calculator.types";

interface WeaponListProps {
  weapons: WeaponSetup[];
  results: WeaponDamageResult[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function WeaponList({
  weapons,
  results,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onDuplicate,
  onRename,
}: WeaponListProps) {
  const selected = weapons.find((w) => w.id === selectedId) ?? weapons[0];
  const listLabels = getCalculatorLabels(selected?.mode ?? "damage");

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {listLabels.buildsTitle}
        </h2>
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <div className="flex flex-col gap-1 p-2">
        {weapons.map((weapon) => {
          const result = results.find((r) => r.weaponId === weapon.id);
          const isSelected = weapon.id === selectedId;
          const mode = weapon.mode ?? "damage";
          const labels = getCalculatorLabels(mode);
          const effectWord =
            mode === "healing"
              ? weapon.attacks.length === 1
                ? "effect"
                : "effects"
              : weapon.attacks.length === 1
                ? "attack"
                : "attacks";

          return (
            <div
              key={weapon.id}
              className={cn(
                "group rounded-md border transition-colors",
                isSelected
                  ? "border-primary/50 bg-primary/10"
                  : "border-transparent hover:border-border/60 hover:bg-muted/40",
              )}
            >
              <button
                type="button"
                className="w-full px-2.5 py-2 text-left"
                onClick={() => onSelect(weapon.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {weapon.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-medium tabular-nums",
                      mode === "healing" ? "text-sky-300" : "text-emerald-400",
                    )}
                  >
                    {result?.totalExpectedPerTurn.toFixed(1) ?? "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {labels.unitCapitalized}
                  {" · "}
                  {weapon.attacks.length} {effectWord}
                  {weapon.attacks.some((a) => (a.resolution ?? "attack-roll") === "attack-roll") && (
                    <>
                      {" · "}+{weapon.attackBonus} vs AC {weapon.targetAC}
                    </>
                  )}
                </p>
              </button>

              {isSelected && (
                <div className="flex items-center gap-1 border-t border-border/40 px-2 pb-2 pt-1">
                  <Input
                    value={weapon.name}
                    onChange={(e) => onRename(weapon.id, e.target.value)}
                    className="h-7 text-xs"
                    aria-label="Build name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    title="Duplicate build"
                    onClick={() => onDuplicate(weapon.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {weapons.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      title="Remove build"
                      onClick={() => onRemove(weapon.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {weapons.length > 1 && (
        <div className="border-t border-border/60 px-3 py-2.5">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            Compare expected output
          </p>
          <div className="space-y-1">
            {[...results]
              .sort((a, b) => b.totalExpectedPerTurn - a.totalExpectedPerTurn)
              .map((r) => {
                const weapon = weapons.find((w) => w.id === r.weaponId);
                const mode = weapon?.mode ?? r.mode ?? "damage";
                return (
                  <div
                    key={r.weaponId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate text-muted-foreground">
                      {r.weaponName} -{" "}
                      {mode === "healing" ? "Healing" : "Damage"}
                      {" · "}
                      {(() => {
                        if (!weapon) {
                          return `${r.attacks.length} effect${r.attacks.length !== 1 ? "s" : ""}`;
                        }
                        const attackCount = weapon.attacks.filter(
                          (a) => a.resolution === "attack-roll",
                        ).length;
                        const saveCount = weapon.attacks.filter(
                          (a) => a.resolution === "save",
                        ).length;
                        const parts: string[] = [];
                        if (attackCount > 0) {
                          parts.push(
                            `${attackCount} attack${attackCount !== 1 ? "s" : ""}`,
                          );
                        }
                        if (saveCount > 0) {
                          parts.push(
                            `${saveCount} save${saveCount !== 1 ? "s" : ""}`,
                          );
                        }
                        return parts.join(" and ") || "0 effects";
                      })()}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-medium tabular-nums",
                        mode === "healing" ? "text-sky-300" : "text-foreground",
                      )}
                    >
                      {r.totalExpectedPerTurn.toFixed(1)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
