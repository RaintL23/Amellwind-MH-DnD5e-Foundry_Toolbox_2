import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/features/builder/components/shared/NumberStepper";
import { DiceEditor } from "./DiceEditor";
import { calcSaveSuccessChance, formatPercent } from "../utils/damage-math.utils";
import type {
  AttackDamageConfig,
  AttackDamageResult,
  WeaponSetup,
} from "../types/damage-calculator.types";

interface AttacksPanelProps {
  weapon: WeaponSetup;
  results: AttackDamageResult[];
  onAddAttack: () => void;
  onRemoveAttack: (attackId: string) => void;
  onUpdateAttack: (attackId: string, patch: Partial<AttackDamageConfig>) => void;
  onAddDice: (attackId: string, sides: number) => void;
  onUpdateDice: (
    attackId: string,
    diceId: string,
    patch: Partial<AttackDamageConfig["diceGroups"][number]>,
  ) => void;
  onRemoveDice: (attackId: string, diceId: string) => void;
}

export function AttacksPanel({
  weapon,
  results,
  onAddAttack,
  onRemoveAttack,
  onUpdateAttack,
  onAddDice,
  onUpdateDice,
  onRemoveDice,
}: AttacksPanelProps) {
  const firstAttack = weapon.attacks[0];

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Attacks per turn
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1"
          onClick={onAddAttack}
        >
          <Plus className="h-3.5 w-3.5" />
          Attack
        </Button>
      </div>

      <div className="divide-y divide-border/50">
        {weapon.attacks.map((attack, index) => {
          const result = results[index];
          const isFirst = index === 0;
          const usesFirst = !isFirst && attack.useFirstAttackDamage;
          const effectiveGroups = usesFirst
            ? firstAttack.diceGroups
            : attack.diceGroups;
          const effectiveFlat = usesFirst
            ? firstAttack.flatBonus
            : attack.flatBonus;
          const resolution = attack.resolution ?? "attack-roll";
          const saveSuccessChance = calcSaveSuccessChance(
            attack.saveDC,
            attack.targetSaveBonus,
          );

          return (
            <div key={attack.id} className="px-3.5 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {attack.label}
                </span>
                {weapon.attacks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveAttack(attack.id)}
                    aria-label={`Remove ${attack.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {!isFirst && (
                <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={attack.useFirstAttackDamage}
                    onChange={(e) =>
                      onUpdateAttack(attack.id, {
                        useFirstAttackDamage: e.target.checked,
                      })
                    }
                    className="rounded border-border"
                  />
                  Same damage as first attack
                </label>
              )}

              <DiceEditor
                groups={effectiveGroups}
                flatBonus={effectiveFlat}
                disabled={usesFirst}
                onFlatBonusChange={(flatBonus) =>
                  onUpdateAttack(attack.id, { flatBonus })
                }
                onDiceChange={(diceId, patch) =>
                  onUpdateDice(attack.id, diceId, patch)
                }
                onAddDice={(sides) => onAddDice(attack.id, sides)}
                onRemoveDice={(diceId) => onRemoveDice(attack.id, diceId)}
              />

              <div className="mt-3 space-y-3 rounded-md border border-border/50 bg-muted/20 p-2.5">
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Resolution
                  </p>
                  <div className="flex gap-1.5">
                    <ResolutionButton
                      active={resolution === "attack-roll"}
                      onClick={() =>
                        onUpdateAttack(attack.id, { resolution: "attack-roll" })
                      }
                    >
                      Attack roll
                    </ResolutionButton>
                    <ResolutionButton
                      active={resolution === "save"}
                      onClick={() =>
                        onUpdateAttack(attack.id, { resolution: "save" })
                      }
                    >
                      Saving throw
                    </ResolutionButton>
                  </div>
                </div>

                {resolution === "attack-roll" && (
                  <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Roll mode
                    </p>
                    <div className="flex gap-1.5">
                      {(
                        [
                          ["normal", "Normal"],
                          ["advantage", "Advantage"],
                          ["disadvantage", "Disadvantage"],
                        ] as const
                      ).map(([mode, label]) => (
                        <RollModeButton
                          key={mode}
                          active={(attack.rollMode ?? "normal") === mode}
                          onClick={() =>
                            onUpdateAttack(attack.id, { rollMode: mode })
                          }
                        >
                          {label}
                        </RollModeButton>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Saving throw
                  </p>
                  <div className="space-y-2">
                    <SettingRow label="Save DC">
                      <NumberStepper
                        value={attack.saveDC}
                        min={5}
                        max={30}
                        ariaLabel="Save DC"
                        onChange={(saveDC) =>
                          onUpdateAttack(attack.id, { saveDC })
                        }
                      />
                    </SettingRow>
                    <SettingRow label="Target save bonus">
                      <NumberStepper
                        value={attack.targetSaveBonus}
                        min={-5}
                        max={15}
                        ariaLabel="Target saving throw bonus"
                        onChange={(targetSaveBonus) =>
                          onUpdateAttack(attack.id, { targetSaveBonus })
                        }
                      />
                    </SettingRow>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={attack.halfDamageOnSave}
                        onChange={(e) =>
                          onUpdateAttack(attack.id, {
                            halfDamageOnSave: e.target.checked,
                          })
                        }
                        className="rounded border-border"
                      />
                      Half damage on successful save
                    </label>
                    <div className="rounded-md bg-muted/40 px-2 py-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Target succeeds
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatPercent(saveSuccessChance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {result && (
                <div className="mt-3 grid gap-1.5 rounded-md bg-muted/30 px-2.5 py-2 text-xs">
                  <Row label="Expression" value={result.diceExpression} />
                  <Row
                    label="Avg. on hit"
                    value={result.averageHit.toFixed(1)}
                    highlight
                  />
                  {resolution === "attack-roll" && (
                    <Row
                      label="Avg. on crit"
                      value={result.averageCrit.toFixed(1)}
                    />
                  )}
                  <Row
                    label="Expected"
                    value={result.expectedDamage.toFixed(1)}
                    highlight
                  />
                  {resolution === "attack-roll" ? (
                    <>
                      <Row
                        label="Hit chance"
                        value={formatPercent(result.hitChance)}
                      />
                      <Row
                        label="Crit chance"
                        value={formatPercent(result.critChance)}
                      />
                    </>
                  ) : (
                    <Row
                      label="Target fails save"
                      value={formatPercent(result.saveFailChance)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function ResolutionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-md border border-primary/50 bg-primary/15 px-2 py-1.5 text-[10px] font-medium text-foreground"
          : "flex-1 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/40"
      }
    >
      {children}
    </button>
  );
}

function RollModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-md border border-primary/50 bg-primary/15 px-2 py-1.5 text-[10px] font-medium text-foreground"
          : "flex-1 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/40"
      }
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? "font-medium tabular-nums text-emerald-400"
            : "font-medium tabular-nums text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
