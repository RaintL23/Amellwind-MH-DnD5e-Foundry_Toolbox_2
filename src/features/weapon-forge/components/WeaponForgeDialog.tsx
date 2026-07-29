import { useMemo } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Pencil, Trash2 } from "lucide-react";
import { useWeaponDialog } from "@/features/weapons/hooks/useWeaponDialog";
import { WeaponDialogHeader } from "@/features/weapons/components/WeaponDialogHeader";
import { WeaponDialogMeta } from "@/features/weapons/components/WeaponDialogMeta";
import { WeaponRarityProgression } from "@/features/weapons/components/WeaponRarityProgression";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { customFeaturesToOptionalMap } from "../mappers/weapon-forge.mapper";

interface WeaponForgeDialogProps {
  weapon: CustomWeapon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRarityIndex?: number;
  initialRarity?: string | null;
  onRarityChange?: (rarity: string) => void;
  onEdit?: (weapon: CustomWeapon) => void;
  onExport?: (weapon: CustomWeapon) => void;
  onDelete?: (weapon: CustomWeapon) => void;
}

export function WeaponForgeDialog({
  weapon,
  open,
  onOpenChange,
  initialRarityIndex = 0,
  initialRarity = null,
  onRarityChange,
  onEdit,
  onExport,
  onDelete,
}: WeaponForgeDialogProps) {
  const extraFeaturesMap = useMemo(() => {
    if (!weapon) return undefined;
    const map = customFeaturesToOptionalMap(
      weapon.customFeatures,
      weapon.name,
    );
    return map.size > 0 ? map : undefined;
  }, [weapon]);

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
    extraFeaturesMap,
  });

  if (!weapon || !displayWeapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <WeaponDialogHeader
          weapon={displayWeapon}
          currentRarityIndex={current}
        />

        <DialogBody>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge
              variant="outline"
              className={
                weapon.isCustom
                  ? "border-amber-700/50 bg-amber-950/40 text-amber-200"
                  : "border-teal-700/50 bg-teal-950/40 text-teal-200"
              }
            >
              {weapon.isCustom ? "Custom (RaintDM)" : "Curated (RaintDM)"}
            </Badge>
            <Badge variant="outline">{weapon.source}</Badge>

            <div className="ml-auto flex gap-1">
              {onExport && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onExport(weapon)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download JSON
                </Button>
              )}
              {onEdit && weapon.isCustom && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(weapon);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && weapon.isCustom && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    onDelete(weapon);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>

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
