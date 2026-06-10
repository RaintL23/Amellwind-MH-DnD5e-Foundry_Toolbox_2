import { cn } from "@/shared/utils/cn";
import { Weapon } from "@/shared/types";
import {
  getWeaponSwitchModeDefinition,
  isVersatileGripWeapon,
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
  const switchModes = getWeaponSwitchModeDefinition(weapon);
  const isVersatile = isVersatileGripWeapon(weapon);

  if (!switchModes && !isVersatile) return null;

  const sectionLabel = switchModes ? "Modes" : "Grip";
  const options = switchModes
    ? switchModes.modes.map((mode, index) => ({
        key: mode.label,
        label: mode.label,
        detail: weapon[mode.damageKey],
        active: useSecondaryMode === (index === 1),
        onClick: () => onChange(index === 1),
      }))
    : [
        {
          key: "one-hand",
          label: "One-hand",
          detail: weapon.dmg1,
          active: !useSecondaryMode,
          onClick: () => onChange(false),
        },
        {
          key: "two-hand",
          label: "Two-hand",
          detail: weapon.dmg2,
          active: useSecondaryMode,
          onClick: () => onChange(true),
        },
      ];

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {sectionLabel}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={option.onClick}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              option.active
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-medium">{option.label}</span>
            {option.detail && (
              <span className="ml-1 text-[10px] opacity-80">({option.detail})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
