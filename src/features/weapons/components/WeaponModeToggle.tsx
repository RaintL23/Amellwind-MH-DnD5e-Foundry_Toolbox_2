import { cn } from "@/shared/utils/cn";
import { Weapon } from "@/shared/types";
import {
  getWeaponGripModeDefinition,
  getWeaponGripModeHint,
  hasWeaponSwitchModes,
} from "../utils/weapon-mode.utils";

interface WeaponModeToggleProps {
  weapon: Weapon;
  useSecondaryMode: boolean;
  onChange: (useSecondaryMode: boolean) => void;
  className?: string;
}

export function WeaponModeToggle({
  weapon,
  useSecondaryMode,
  onChange,
  className,
}: WeaponModeToggleProps) {
  const gripDefinition = getWeaponGripModeDefinition(weapon);
  if (!gripDefinition) return null;

  const sectionLabel = hasWeaponSwitchModes(weapon) ? "Modes" : "Grip";

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {sectionLabel}
      </span>
      <div className="flex flex-col gap-1.5">
        {gripDefinition.modes.map((mode, index) => {
          const isActive = useSecondaryMode === (index === 1);
          const damage = weapon[mode.damageKey];
          const hint = getWeaponGripModeHint(mode);

          return (
            <button
              key={mode.label}
              type="button"
              onClick={() => onChange(index === 1)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-left transition-colors",
                isActive
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-[11px] font-medium">{mode.label}</span>
                {damage && (
                  <span className="text-[10px] opacity-80">({damage})</span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] leading-snug opacity-75">{hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
