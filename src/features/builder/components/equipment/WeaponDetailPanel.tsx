import { cn } from "@/shared/utils/cn";
import { EquippedWeapon } from "@/shared/types";
import { RarityButtonGroup } from "../shared/RarityButtonGroup";

interface WeaponDetailPanelProps {
  equipped: EquippedWeapon;
  onRarityChange: (rarity: string) => void;
  onVersatileChange: (twoHanded: boolean) => void;
}

export function WeaponDetailPanel({
  equipped,
  onRarityChange,
  onVersatileChange,
}: WeaponDetailPanelProps) {
  const isVersatile = equipped.weapon.properties.includes("V");

  return (
    <div className="w-full rounded-md border border-border bg-background/50 p-3 space-y-2">
      <RarityButtonGroup
        value={equipped.rarity}
        onChange={(r) => onRarityChange(r)}
      />
      {isVersatile && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium uppercase">
            Grip
          </span>
          <button
            type="button"
            onClick={() => onVersatileChange(false)}
            className={cn(
              "px-2 py-0.5 text-xs rounded border transition-colors",
              !equipped.useVersatile
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            One-hand ({equipped.weapon.dmg1})
          </button>
          <button
            type="button"
            onClick={() => onVersatileChange(true)}
            className={cn(
              "px-2 py-0.5 text-xs rounded border transition-colors",
              equipped.useVersatile
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Two-hand ({equipped.weapon.dmg2})
          </button>
        </div>
      )}
    </div>
  );
}
