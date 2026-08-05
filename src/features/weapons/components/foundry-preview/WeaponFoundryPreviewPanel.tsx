import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { FoundryItem } from "@/shared/foundry";
import { FoundryModuleRequirementsNotice } from "@/shared/foundry";
import {
  resolveCombatChainsAtRarity,
  type ResolvedCombatChain,
} from "@/shared/foundry/weapons";
import type { CustomWeapon } from "@/features/weapon-forge/types/weapon-forge.types";
import { foundryItemFilename } from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";
import { cn } from "@/shared/utils/cn";
import { PreviewBody } from "@/features/weapons/components/foundry-preview/FoundryPreviewBody";

export interface WeaponFoundryPreviewPanelProps {
  weapon: CustomWeapon;
  rarityIndex: number;
  /**
   * Exact Foundry Item payload Export downloads. Must be built with the same
   * function as export (`buildAmellwindWeaponFoundryItem` or `buildWeaponFoundryItem`).
   */
  item: FoundryItem | null;
  onRarityIndexChange?: (index: number) => void;
  /** When false, hide the rarity selector (parent already controls rarity). */
  showRaritySelect?: boolean;
  className?: string;
}

/**
 * Read-only Foundry v12 / dnd5e 4.4.4 preview of an already-built weapon Item.
 * The parent must pass the exact object Export will download.
 */
export function WeaponFoundryPreviewPanel({
  weapon,
  rarityIndex,
  item,
  onRarityIndexChange,
  showRaritySelect = true,
  className,
}: WeaponFoundryPreviewPanelProps) {
  const clamped = Math.max(
    0,
    Math.min(rarityIndex, Math.max(0, weapon.rarityRows.length - 1)),
  );

  const chains = useMemo(() => {
    try {
      return resolveCombatChainsAtRarity(weapon, clamped);
    } catch {
      return [] as ResolvedCombatChain[];
    }
  }, [weapon, clamped]);

  return (
    <div className={cn("space-y-3", className)}>
      <FoundryModuleRequirementsNotice kind="weapon" collapsible />

      {showRaritySelect && weapon.rarityRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="foundry-preview-rarity" className="text-xs">
            Preview rarity
          </Label>
          <Select
            id="foundry-preview-rarity"
            value={String(clamped)}
            onChange={(e) =>
              onRarityIndexChange?.(Number.parseInt(e.target.value, 10))
            }
            disabled={!onRarityIndexChange}
            className="h-8 w-auto min-w-[9rem] text-xs"
          >
            {weapon.rarityRows.map((row, index) => (
              <option key={`${row.rarity}-${index}`} value={String(index)}>
                {row.rarity}
              </option>
            ))}
          </Select>
        </div>
      )}

      {!item ? (
        <p className="text-sm text-destructive">
          Could not build Foundry preview for this weapon.
        </p>
      ) : (
        <PreviewBody
          item={item}
          chains={chains}
          filename={foundryItemFilename(weapon, clamped)}
        />
      )}
    </div>
  );
}
