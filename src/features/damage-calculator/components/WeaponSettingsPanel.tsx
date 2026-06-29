import { NumberStepper } from "@/features/builder/components/shared/NumberStepper";
import { formatDamageTypeLabel } from "@/shared/utils/defense-grant.parser";
import type { DamageType } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { ALL_DAMAGE_TYPES, formatPercent } from "../utils/damage-math.utils";
import type { WeaponDamageResult, WeaponSetup } from "../types/damage-calculator.types";

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
  const hasAttackRollAttacks = weapon.attacks.some(
    (a) => (a.resolution ?? "attack-roll") === "attack-roll",
  );

  return (
    <div className="space-y-4">
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

      <div className="rounded-lg border border-border/60 bg-card p-3.5">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Target
        </h2>
        <div className="space-y-3">
          <SettingRow label="Armor class">
            <NumberStepper
              value={weapon.targetAC}
              min={5}
              max={30}
              ariaLabel="Target armor class"
              onChange={(targetAC) => onUpdate({ targetAC })}
            />
          </SettingRow>
          <SettingRow label="Save bonus">
            <NumberStepper
              value={weapon.targetSaveBonus}
              min={-5}
              max={15}
              ariaLabel="Target saving throw bonus"
              onChange={(targetSaveBonus) => onUpdate({ targetSaveBonus })}
            />
          </SettingRow>
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
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-3.5">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Critical hits
        </h2>
        <div className="space-y-3">
          <SettingRow label="Crit on">
            <NumberStepper
              value={weapon.critRange}
              min={18}
              max={20}
              ariaLabel="Critical hit range"
              onChange={(critRange) => onUpdate({ critRange })}
            />
          </SettingRow>
          <p className="text-[10px] text-muted-foreground">
            Natural {weapon.critRange === 20 ? "20" : `${weapon.critRange}–20`}
          </p>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={weapon.useBrutalCrit}
              onChange={(e) => onUpdate({ useBrutalCrit: e.target.checked })}
              className="rounded border-border"
            />
            Brutal Critical (extra weapon dice on crit)
          </label>
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

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4 text-center">
        <div className="text-[32px] font-medium leading-none text-emerald-400 tabular-nums">
          {result.totalExpectedPerTurn.toFixed(1)}
        </div>
        <p className="mt-1 text-[11px] text-emerald-300/80">
          expected damage per turn
        </p>
        <div
          className={cn(
            "mt-3 grid gap-2 text-left text-xs",
            hasAttackRollAttacks ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          <div className="rounded-md bg-black/20 px-2 py-1.5">
            <p className="text-muted-foreground">Avg. on hit (turn)</p>
            <p className="font-medium tabular-nums text-foreground">
              {result.totalAveragePerTurn.toFixed(1)}
            </p>
          </div>
          {hasAttackRollAttacks && (
            <>
              <div className="rounded-md bg-black/20 px-2 py-1.5">
                <p className="text-muted-foreground">Avg. on crit (turn)</p>
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
        </div>
        {hasAttackRollAttacks && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Turn hit chance = probability at least one attack-roll attack hits.
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
