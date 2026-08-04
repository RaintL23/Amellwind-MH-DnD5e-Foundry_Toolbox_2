import { useMemo } from "react";
import { Weapon } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogBody,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeaponDialog } from "../hooks/useWeaponDialog";
import { WeaponDialogHeader } from "./WeaponDialogHeader";
import { WeaponDialogMeta } from "./WeaponDialogMeta";
import { WeaponRarityProgression } from "./WeaponRarityProgression";
import { WeaponCatalogExportMenu } from "./WeaponCatalogExportMenu";
import { WeaponFoundryPreviewPanel } from "./WeaponFoundryPreviewPanel";
import {
  buildAmellwindWeaponFoundryItem,
  weaponToExportCustomWeapon,
} from "../services/weapon-foundry-export.service";

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

  const foundryWeapon = useMemo(() => {
    if (!displayWeapon) return null;
    return weaponToExportCustomWeapon(displayWeapon, featuresMap);
  }, [displayWeapon, featuresMap]);

  // One build for preview + Export download (same FoundryItem reference).
  const foundryItem = useMemo(() => {
    if (!displayWeapon) return null;
    try {
      return buildAmellwindWeaponFoundryItem(
        displayWeapon,
        current,
        featuresMap,
      );
    } catch {
      return null;
    }
  }, [displayWeapon, current, featuresMap]);

  if (!weapon || !displayWeapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <WeaponDialogHeader
          weapon={displayWeapon}
          currentRarityIndex={current}
          exportSlot={
            foundryItem ? (
              <WeaponCatalogExportMenu
                weapon={displayWeapon}
                rarityIndex={current}
                item={foundryItem}
              />
            ) : null
          }
        />

        <DialogBody>
          <Tabs defaultValue="rules" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="foundry">Foundry VTT v12</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-0 space-y-4">
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
            </TabsContent>

            <TabsContent value="foundry" className="mt-0">
              {foundryWeapon && (
                <WeaponFoundryPreviewPanel
                  weapon={foundryWeapon}
                  rarityIndex={current}
                  item={foundryItem}
                  onRarityIndexChange={setCurrent}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
