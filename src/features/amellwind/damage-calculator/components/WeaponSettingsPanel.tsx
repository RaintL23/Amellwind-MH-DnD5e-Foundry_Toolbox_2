import { NumberStepper } from "@/shared/components/NumberStepper";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDamageTypeLabel } from "@/shared/utils/defense-grant.parser";
import type { DamageType } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { getCalculatorLabels } from "../utils/calculator-labels";
import { ALL_DAMAGE_TYPES, formatPercent } from "../utils/damage-math.utils";
import type {
  WeaponDamageResult,
  WeaponSetup,
} from "../types/damage-calculator.types";

interface WeaponSettingsPanelProps {
  weapon: WeaponSetup;
  result: WeaponDamageResult;
  onUpdate: (patch: Partial<WeaponSetup>) => void;
}

export function WeaponSettingsPanel({
  weapon,
  result,
  onUpdate,
}: WeaponSettingsPanelProps) {
  const mode = weapon.mode ?? "damage";
  const labels = getCalculatorLabels(mode);
  const isHealing = mode === "healing";
  const hasAttackRollAttacks = weapon.attacks.some(
    (a) => (a.resolution ?? "attack-roll") === "attack-roll",
  );
  const hasSaveAttacks = weapon.attacks.some(
    (a) => (a.resolution ?? "attack-roll") === "save",
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card p-3.5">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Calculator mode
        </h2>
        <div className="flex gap-1.5">
          {(
            [
              ["damage", "Damage"],
              ["healing", "Healing"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate({ mode: value })}
              className={
                mode === value
                  ? "flex-1 rounded-md border border-primary/50 bg-primary/15 px-2 py-1.5 text-[10px] font-medium text-foreground"
                  : "flex-1 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/40"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {isHealing
            ? "Healing ignores resistances, immunities, and critical doubling."
            : "Damage uses resistances, immunities, and critical hits."}
        </p>
      </div>

      {hasAttackRollAttacks && (
        <div className="rounded-lg border border-border/60 bg-card p-3.5">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Attack roll
          </h2>
          <SettingRow label="Attack bonus">
            <NumberStepper
              value={weapon.attackBonus}
              min={-5}
              max={20}
              ariaLabel="Attack bonus"
              onChange={(attackBonus) => onUpdate({ attackBonus })}
            />
          </SettingRow>
        </div>
      )}

      {hasAttackRollAttacks && !isHealing && (
        <div className="rounded-lg border border-border/60 bg-card p-3.5">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Critical hits
          </h2>
          <div className="space-y-3">
            <SettingRow label="Crit on">
              <NumberStepper
                value={weapon.critRange}
                min={10}
                max={20}
                ariaLabel="Critical hit range"
                onChange={(critRange) => onUpdate({ critRange })}
              />
            </SettingRow>
            <p className="text-[10px] text-muted-foreground">
              Natural {weapon.critRange === 20 ? "20" : `${weapon.critRange}–20`}
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="brutal-crit"
                checked={weapon.useBrutalCrit}
                onCheckedChange={(c) => onUpdate({ useBrutalCrit: c === true })}
              />
              <Label
                htmlFor="brutal-crit"
                className="cursor-pointer text-xs font-normal text-muted-foreground"
              >
                Brutal Critical (extra weapon dice on crit)
              </Label>
            </div>
            {weapon.useBrutalCrit && (
              <SettingRow label="Extra dice on crit">
                <NumberStepper
                  value={weapon.brutalCritExtraDice}
                  min={1}
                  max={6}
                  ariaLabel="Brutal critical extra dice"
                  onChange={(brutalCritExtraDice) =>
                    onUpdate({ brutalCritExtraDice })
                  }
                />
              </SettingRow>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-card p-3.5">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Target
        </h2>
        <div className="space-y-3">
          {hasAttackRollAttacks && (
            <SettingRow label="Armor class">
              <NumberStepper
                value={weapon.targetAC}
                min={5}
                max={30}
                ariaLabel="Target armor class"
                onChange={(targetAC) => onUpdate({ targetAC })}
              />
            </SettingRow>
          )}
          {hasSaveAttacks && (
            <SettingRow label="Save bonus">
              <NumberStepper
                value={weapon.targetSaveBonus}
                min={-5}
                max={15}
                ariaLabel="Target saving throw bonus"
                onChange={(targetSaveBonus) => onUpdate({ targetSaveBonus })}
              />
            </SettingRow>
          )}
          {!isHealing && (
            <>
              <DefenseToggleGroup
                label="Resistances"
                types={weapon.damageResistances}
                onChange={(damageResistances) => onUpdate({ damageResistances })}
              />
              <DefenseToggleGroup
                label="Immunities"
                types={weapon.damageImmunities}
                onChange={(damageImmunities) => onUpdate({ damageImmunities })}
              />
            </>
          )}
          {!hasAttackRollAttacks && !hasSaveAttacks && (
            <p className="text-[10px] text-muted-foreground">
              Add an attack roll or saving throw effect to configure the target.
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg p-4 text-center",
          isHealing
            ? "border border-sky-500/30 bg-sky-950/30"
            : "border border-emerald-500/30 bg-emerald-950/30",
        )}
      >
        <div
          className={cn(
            "text-[32px] font-medium leading-none tabular-nums",
            isHealing ? "text-sky-300" : "text-emerald-400",
          )}
        >
          {result.totalExpectedPerTurn.toFixed(1)}
        </div>
        <p
          className={cn(
            "mt-1 text-[11px]",
            isHealing ? "text-sky-200/80" : "text-emerald-300/80",
          )}
        >
          {labels.expectedPerTurn}
        </p>
        <div
          className={cn(
            "mt-3 grid gap-2 text-left text-xs",
            hasAttackRollAttacks && !isHealing ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          <div className="rounded-md bg-black/20 px-2 py-1.5">
            <p className="text-muted-foreground">{labels.avgOnHitTurn}</p>
            <p className="font-medium tabular-nums text-foreground">
              {result.totalAveragePerTurn.toFixed(1)}
            </p>
          </div>
          {hasAttackRollAttacks && !isHealing && (
            <>
              <div className="rounded-md bg-black/20 px-2 py-1.5">
                <p className="text-muted-foreground">{labels.avgOnCritTurn}</p>
                <p className="font-medium tabular-nums text-foreground">
                  {result.totalCritAveragePerTurn.toFixed(1)}
                </p>
              </div>
              <div className="rounded-md bg-black/20 px-2 py-1.5">
                <p className="text-muted-foreground">Hit chance (turn)</p>
                <p className="font-medium tabular-nums text-foreground">
                  {formatPercent(result.turnHitChance)}
                </p>
              </div>
            </>
          )}
          {hasAttackRollAttacks && isHealing && (
            <div className="rounded-md bg-black/20 px-2 py-1.5">
              <p className="text-muted-foreground">Hit chance (turn)</p>
              <p className="font-medium tabular-nums text-foreground">
                {formatPercent(result.turnHitChance)}
              </p>
            </div>
          )}
        </div>
        {hasAttackRollAttacks && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Turn hit chance = probability at least one attack-roll effect hits.
          </p>
        )}
      </div>
    </div>
  );
}

function DefenseToggleGroup({
  label,
  types,
  onChange,
}: {
  label: string;
  types: DamageType[];
  onChange: (types: DamageType[]) => void;
}) {
  function toggle(type: DamageType) {
    if (types.includes(type)) {
      onChange(types.filter((t) => t !== type));
    } else {
      onChange([...types, type]);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {ALL_DAMAGE_TYPES.map((type) => {
          const active = types.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
                active
                  ? label === "Immunities"
                    ? "border-rose-500/50 bg-rose-950/40 text-rose-200"
                    : "border-amber-500/50 bg-amber-950/40 text-amber-200"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40",
              )}
            >
              {formatDamageTypeLabel(type)}
            </button>
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
