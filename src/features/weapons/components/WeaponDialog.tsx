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
}

export function WeaponDialog({
  weapon,
  open,
  onOpenChange,
}: WeaponDialogProps) {
  const {
    current,
    setCurrent,
    featuresMap,
    columnChains,
    baseFeatures,
    baseFeatureNameKeys,
    handlePrev,
    handleNext,
  } = useWeaponDialog(weapon, open);

  if (!weapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <WeaponDialogHeader weapon={weapon} />

        <DialogBody>
          <WeaponDialogMeta weapon={weapon} currentRarityIndex={current} />

          <WeaponRarityProgression
            weapon={weapon}
            current={current}
            onSelect={setCurrent}
            onPrev={handlePrev}
            onNext={handleNext}
            columnChains={columnChains}
            featuresMap={featuresMap}
            baseFeatures={baseFeatures}
            baseFeatureNameKeys={baseFeatureNameKeys}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
