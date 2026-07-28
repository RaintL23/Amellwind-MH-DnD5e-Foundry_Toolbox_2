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
  onRarityChange?: (index: number) => void;
}

export function WeaponDialog({
  weapon,
  open,
  onOpenChange,
  initialRarityIndex = 0,
  onRarityChange,
}: WeaponDialogProps) {
  const {
    current,
    setCurrent,
    featuresMap,
    mhItemEffectsMap,
    columnChains,
    baseFeatures,
    baseFeatureNameKeys,
    handlePrev,
    handleNext,
  } = useWeaponDialog(weapon, open, { initialRarityIndex, onRarityChange });

  if (!weapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <WeaponDialogHeader weapon={weapon} currentRarityIndex={current} />

        <DialogBody>
          <WeaponDialogMeta weapon={weapon} />

          <WeaponRarityProgression
            weapon={weapon}
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
