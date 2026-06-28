import { NumberStepper } from "@/features/builder/components/shared/NumberStepper";
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
        <div className="space-y-3">
          <SettingRow label="Attack bonus">
            <NumberStepper
              value={weapon.attackBonus}
              min={-5}
              max={20}
              ariaLabel="Attack bonus"
              onChange={(attackBonus) => onUpdate({ attackBonus })}
            />
          </SettingRow>
          <SettingRow label="Target AC">
            <NumberStepper
              value={weapon.targetAC}
              min={5}
              max={30}
              ariaLabel="Target armor class"
              onChange={(targetAC) => onUpdate({ targetAC })}
            />
          </SettingRow>
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
        <div className="mt-3 grid grid-cols-2 gap-2 text-left text-xs">
          <div className="rounded-md bg-black/20 px-2 py-1.5">
            <p className="text-muted-foreground">Avg. on hit (turn)</p>
            <p className="font-medium tabular-nums text-foreground">
              {result.totalAveragePerTurn.toFixed(1)}
            </p>
          </div>
          {hasAttackRollAttacks && (
            <div className="rounded-md bg-black/20 px-2 py-1.5">
              <p className="text-muted-foreground">Avg. on crit (turn)</p>
              <p className="font-medium tabular-nums text-foreground">
                {result.totalCritAveragePerTurn.toFixed(1)}
              </p>
            </div>
          )}
        </div>
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
