import { EquippedWeapon } from "@/shared/types";
import { WeaponModeToggle } from "@/features/weapons/components/WeaponModeToggle";
import { hasWeaponGripModes } from "@/features/weapons/utils/weapon-mode.utils";
import { RarityButtonGroup } from "../shared/RarityButtonGroup";

interface WeaponDetailPanelProps {
  equipped: EquippedWeapon;
  showHomebrewDetails?: boolean;
  onRarityChange: (rarity: string) => void;
  onVersatileChange: (twoHanded: boolean) => void;
}

export function WeaponDetailPanel({
  equipped,
  showHomebrewDetails = true,
  onRarityChange,
  onVersatileChange,
}: WeaponDetailPanelProps) {
  const showModeToggle = hasWeaponGripModes(equipped.weapon);
  const isDndWeapon =
    equipped.weapon.contentSource === "dnd" || !showHomebrewDetails;

  return (
    <div className="w-full rounded-md border border-border bg-background/50 p-3 space-y-2">
      {!isDndWeapon && (
        <RarityButtonGroup
          value={equipped.rarity}
          onChange={(r) => onRarityChange(r)}
        />
      )}
      {showModeToggle && (
        <WeaponModeToggle
          weapon={equipped.weapon}
          useSecondaryMode={equipped.useVersatile}
          onChange={onVersatileChange}
        />
      )}
    </div>
  );
}
