import { useMemo } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2 } from "lucide-react";
import { useWeaponDialog } from "@/features/weapons/hooks/useWeaponDialog";
import { WeaponDialogHeader } from "@/features/weapons/components/WeaponDialogHeader";
import { WeaponDialogMeta } from "@/features/weapons/components/WeaponDialogMeta";
import { WeaponRarityProgression } from "@/features/weapons/components/WeaponRarityProgression";
import { WeaponFoundryPreviewPanel } from "@/features/weapons/components/WeaponFoundryPreviewPanel";
import { buildWeaponFoundryItem } from "../mappers/weapon-forge-foundry.export";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { customFeaturesToOptionalMap } from "../mappers/weapon-forge.mapper";
import type { FoundryItem } from "@/shared/foundry";
import { WeaponForgeExportMenu } from "./WeaponForgeExportMenu";
import type { FoundryExportOptions } from "./WeaponForgeExportMenu";

interface WeaponForgeDialogProps {
  weapon: CustomWeapon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRarityIndex?: number;
  initialRarity?: string | null;
  onRarityChange?: (rarity: string) => void;
  onEdit?: (weapon: CustomWeapon) => void;
  onExportAmellwind?: (weapon: CustomWeapon) => void;
  onExportFoundry?: (
    weapon: CustomWeapon,
    rarityIndex: number,
    item?: FoundryItem,
    options?: FoundryExportOptions,
  ) => void;
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
  onExportAmellwind,
  onExportFoundry,
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
    // Forge JSON (rarity rows + customFeatures) is authoritative — do not inject
    // Amellwind optional features matched only by weapon name.
    includePrerequisiteMatches: false,
  });

  const foundryItem = useMemo(() => {
    if (!weapon) return null;
    try {
      return buildWeaponFoundryItem(weapon, current);
    } catch {
      return null;
    }
  }, [weapon, current]);

  if (!weapon || !displayWeapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <WeaponDialogHeader
          weapon={displayWeapon}
          currentRarityIndex={current}
        />

        <DialogBody>
          <div className="flex flex-wrap items-center gap-2 mb-3">
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
              {onExportAmellwind && onExportFoundry && (
                <WeaponForgeExportMenu
                  weapon={weapon}
                  foundryRarityIndex={current}
                  foundryItem={foundryItem ?? undefined}
                  variant="outline"
                  size="sm"
                  triggerLabel="Download JSON"
                  onExportAmellwind={onExportAmellwind}
                  onExportFoundry={onExportFoundry}
                />
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
              <WeaponFoundryPreviewPanel
                weapon={weapon}
                rarityIndex={current}
                item={foundryItem}
                onRarityIndexChange={setCurrent}
              />
            </TabsContent>
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
