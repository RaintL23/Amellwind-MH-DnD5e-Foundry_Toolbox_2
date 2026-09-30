import { Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/shared/components/NumberStepper";
import { DiceEditor } from "./DiceEditor";
import { getCalculatorLabels } from "../utils/calculator-labels";
import {
  calcSaveSuccessChance,
  formatPercent,
  resolveSaveSuccessEffect,
} from "../utils/damage-math.utils";
import type {
  AttackDamageConfig,
  AttackDamageResult,
  FlatBonus,
  SaveSuccessEffect,
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
  onAddFlatBonus: (attackId: string) => void;
  onUpdateFlatBonus: (
    attackId: string,
    bonusId: string,
    patch: Partial<FlatBonus>,
  ) => void;
  onRemoveFlatBonus: (attackId: string, bonusId: string) => void;
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
  onAddFlatBonus,
  onUpdateFlatBonus,
  onRemoveFlatBonus,
}: AttacksPanelProps) {
  const firstAttack = weapon.attacks[0];
  const mode = weapon.mode ?? "damage";
  const labels = getCalculatorLabels(mode);
  const showCritStats = mode === "damage";

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {labels.attacksPerTurn}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1"
          onClick={onAddAttack}
        >
          <Plus className="h-3.5 w-3.5" />
          {labels.addAttack}
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
          const effectiveFlatBonuses = usesFirst
            ? firstAttack.flatBonuses
            : attack.flatBonuses;
          const resolution = attack.resolution ?? "attack-roll";
          const rollMode = attack.rollMode ?? "normal";
          const saveSuccessEffect = resolveSaveSuccessEffect(attack);
          const saveSuccessChance = calcSaveSuccessChance(
            attack.saveDC,
            weapon.targetSaveBonus,
            rollMode,
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
                  {labels.sameAsFirst}
                </label>
              )}

              <DiceEditor
                groups={effectiveGroups}
                flatBonuses={effectiveFlatBonuses}
                disabled={usesFirst}
                mode={mode}
                onFlatBonusChange={(bonusId, patch) =>
                  onUpdateFlatBonus(attack.id, bonusId, patch)
                }
                onAddFlatBonus={() => onAddFlatBonus(attack.id)}
                onRemoveFlatBonus={(bonusId) =>
                  onRemoveFlatBonus(attack.id, bonusId)
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

                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {resolution === "save" ? "Save roll mode" : "Roll mode"}
                  </p>
                  <div className="flex gap-1.5">
                    {(
                      [
                        ["normal", "Normal"],
                        ["advantage", "Advantage"],
                        ["disadvantage", "Disadvantage"],
                      ] as const
                    ).map(([modeOption, label]) => (
                      <RollModeButton
                        key={modeOption}
                        active={rollMode === modeOption}
                        onClick={() =>
                          onUpdateAttack(attack.id, { rollMode: modeOption })
                        }
                      >
                        {label}
                      </RollModeButton>
                    ))}
                  </div>
                  {resolution === "save" && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Applies to the target&apos;s saving throw (e.g. Magic
                      Resistance = advantage).
                    </p>
                  )}
                </div>

                {resolution === "save" && (
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

                      <div>
                        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {labels.saveSuccessEffect}
                        </p>
                        <div className="flex gap-1.5">
                          {(
                            [
                              ["half", "Half"],
                              ["none", "None"],
                              ["full", "Full"],
                            ] as const
                          ).map(([effect, label]) => (
                            <RollModeButton
                              key={effect}
                              active={saveSuccessEffect === effect}
                              onClick={() =>
                                onUpdateAttack(attack.id, {
                                  saveSuccessEffect: effect,
                                  halfDamageOnSave: effect === "half",
                                })
                              }
                            >
                              {label}
                            </RollModeButton>
                          ))}
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground">
                          {saveSuccessEffectHint(saveSuccessEffect, labels)}
                        </p>
                      </div>

                      <div className="space-y-1 rounded-md bg-muted/40 px-2 py-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Target succeeds
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatPercent(saveSuccessChance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Target fails
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatPercent(1 - saveSuccessChance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {result && (
                <AttackResultPanel
                  result={result}
                  resolution={resolution}
                  showCritStats={showCritStats}
                  labels={labels}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function saveSuccessEffectHint(
  effect: SaveSuccessEffect,
  labels: ReturnType<typeof getCalculatorLabels>,
): string {
  if (effect === "half") return labels.halfOnSave;
  if (effect === "none") return labels.noneOnSave;
  return labels.fullOnSave;
}

function AttackResultPanel({
  result,
  resolution,
  showCritStats,
  labels,
}: {
  result: AttackDamageResult;
  resolution: "attack-roll" | "save";
  showCritStats: boolean;
  labels: ReturnType<typeof getCalculatorLabels>;
}) {
  return (
    <div className="mt-3 grid gap-1.5 rounded-md bg-muted/30 px-2.5 py-2 text-xs">
      <Row
        label="Expression"
        value={result.diceExpression}
        description={labels.expressionHint}
      />
      <Row
        label={labels.avgOnHit}
        value={result.averageHit.toFixed(1)}
        description={labels.averageHitHint}
        highlight
      />
      {resolution === "attack-roll" && showCritStats && (
        <Row
          label={labels.avgOnCrit}
          value={result.averageCrit.toFixed(1)}
          description={labels.averageCritHint}
        />
      )}
      <Row
        label={labels.expected}
        value={result.expectedDamage.toFixed(1)}
        description={
          resolution === "attack-roll"
            ? labels.expectedAttackHint
            : labels.expectedSaveHint
        }
        highlight
      />
      {resolution === "attack-roll" ? (
        <>
          <Row
            label="Hit chance"
            value={formatPercent(result.hitChance)}
            description="Chance the attack hits the target (includes critical hits)."
          />
          {showCritStats && (
            <Row
              label="Crit chance"
              value={formatPercent(result.critChance)}
              description="Chance of a critical hit, based on the configured crit range."
            />
          )}
        </>
      ) : (
        <>
          <Row
            label="Target fails save"
            value={formatPercent(result.saveFailChance)}
            description="Chance the target fails the save against the effect's DC."
          />
          <Row
            label="Target succeeds"
            value={formatPercent(result.saveSuccessChance)}
            description="Chance the target succeeds on the save (5e: no auto success on nat 20)."
          />
          <Row
            label={labels.onSaveFail}
            value={result.averageOnSaveFail.toFixed(1)}
            description={`Full ${labels.unit} when the target fails the save.`}
          />
          <Row
            label={labels.onSaveSuccess}
            value={result.averageOnSaveSuccess.toFixed(1)}
            description={`${labels.unitCapitalized} applied when the target succeeds, based on the save outcome setting.`}
          />
        </>
      )}
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
  description,
  highlight = false,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="group relative inline-flex items-center gap-1 text-muted-foreground">
        {label}
        <Info
          className="h-3 w-3 shrink-0 text-muted-foreground/60"
          aria-hidden
        />
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md border border-border bg-popover px-2 py-1.5 text-[10px] leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100"
        >
          {description}
        </span>
      </span>
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
