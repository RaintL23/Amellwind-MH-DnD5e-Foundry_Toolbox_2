import { EquippedWeapon } from "@/shared/types";
import { WeaponModeToggle } from "@/features/amellwind/weapons/components/WeaponModeToggle";
import { hasWeaponGripModes } from "@/features/amellwind/weapons/utils/weapon-mode.utils";
import {
  getGripModeOccupiedHandHint,
  isGripModeBlockedByOccupiedHand,
  type GripModeSlotContext,
} from "@/features/amellwind/weapons/utils/weapon-hands.utils";
import { RarityButtonGroup } from "../shared/RarityButtonGroup";

interface WeaponDetailPanelProps {
  equipped: EquippedWeapon;
  gripContext: GripModeSlotContext;
  showHomebrewDetails?: boolean;
  onRarityChange: (rarity: string) => void;
  onModeChange: (modeIndex: number) => void;
}

export function WeaponDetailPanel({
  equipped,
  gripContext,
  showHomebrewDetails = true,
  onRarityChange,
  onModeChange,
}: WeaponDetailPanelProps) {
  const { weapon, activeModeIndex } = equipped;
  const showModeToggle = hasWeaponGripModes(weapon);
  const isDndWeapon =
    equipped.weapon.contentSource === "dnd" || !showHomebrewDetails;

  if (isDndWeapon) return null;

  return (
    <div className="w-full rounded-md border border-border bg-background/50 p-3 space-y-2">
      <RarityButtonGroup
        value={equipped.rarity}
        onChange={(r) => onRarityChange(r)}
      />
      {showModeToggle && (
        <WeaponModeToggle
          weapon={weapon}
          activeModeIndex={activeModeIndex}
          onChange={onModeChange}
          isModeDisabled={(mode) =>
            isGripModeBlockedByOccupiedHand(mode, gripContext)
          }
          getModeDisabledHint={(mode) =>
            getGripModeOccupiedHandHint(mode, gripContext)
          }
        />
      )}
    </div>
  );
}
