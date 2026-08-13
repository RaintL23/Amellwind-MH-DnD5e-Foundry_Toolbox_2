import { Weapon } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogBody,
} from "@/components/ui/dialog";
import { useWeaponDialog } from "../hooks/useWeaponDialog";
import { WeaponDialogHeader } from "./WeaponDialogHeader";
import { WeaponDialogMeta } from "./WeaponDialogMeta";
import { WeaponRarityProgression } from "./WeaponRarityProgression";

interface WeaponDialogProps {
  weapon: Weapon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRarityIndex?: number;
  initialRarity?: string | null;
  onRarityChange?: (rarity: string) => void;
}

export function WeaponDialog({
  weapon,
  open,
  onOpenChange,
  initialRarityIndex = 0,
  initialRarity = null,
  onRarityChange,
}: WeaponDialogProps) {
  const {
    current,
    setCurrent,
    displayWeapon,
    featuresMap,
    mhItemEffectsMap,
    columnChains,
    baseFeatures,
    baseFeatureNameKeys,
    handlePrev,
    handleNext,
  } = useWeaponDialog(weapon, open, {
    initialRarityIndex,
    initialRarity,
    onRarityChange,
  });

  if (!weapon || !displayWeapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <WeaponDialogHeader
          weapon={displayWeapon}
          currentRarityIndex={current}
        />

        <DialogBody className="space-y-4">
          <WeaponDialogMeta weapon={displayWeapon} />

          <WeaponRarityProgression
            weapon={displayWeapon}
            current={current}
            onSelect={setCurrent}
            onPrev={handlePrev}
            onNext={handleNext}
            columnChains={columnChains}
            featuresMap={featuresMap}
            mhItemEffectsMap={mhItemEffectsMap}
            baseFeatures={baseFeatures}
            baseFeatureNameKeys={baseFeatureNameKeys}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
