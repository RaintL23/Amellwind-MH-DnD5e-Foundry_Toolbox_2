import { useMemo } from "react";
import { Download } from "lucide-react";
import type { Weapon } from "@/shared/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FoundryModuleRequirementsNotice,
  type FoundryItem,
} from "@/shared/foundry";
import { buildWeaponFoundryResourceGroups } from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";
import {
  exportAmellwindWeaponFoundryJson,
  weaponToExportCustomWeapon,
} from "../services/weapon-foundry-export.service";

interface WeaponCatalogExportMenuProps {
  weapon: Weapon;
  rarityIndex: number;
  /** Exact Foundry Item payload — must be the same object the preview shows. */
  item: FoundryItem;
}

export function WeaponCatalogExportMenu({
  weapon,
  rarityIndex,
  item,
}: WeaponCatalogExportMenuProps) {
  const hasResources = useMemo(() => {
    try {
      return (
        buildWeaponFoundryResourceGroups(
          weaponToExportCustomWeapon(weapon),
          rarityIndex,
        ).length > 0
      );
    } catch {
      return false;
    }
  }, [weapon, rarityIndex]);

  const exportFoundry = (includeResources: boolean) => {
    exportAmellwindWeaponFoundryJson(weapon, rarityIndex, undefined, item, {
      includeResources,
    });
  };

  const rarityLabel = weapon.rarityRows[rarityIndex]?.rarity ?? "rarity";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          aria-label={`Export ${weapon.name} to Foundry`}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-xs">
        {hasResources ? (
          <>
            <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">
              Foundry VTT (v12) — {rarityLabel}
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="text-xs"
              onSelect={() => exportFoundry(true)}
            >
              Weapon + resources
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs"
              onSelect={() => exportFoundry(false)}
            >
              Weapon only
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            className="text-xs"
            onSelect={() => exportFoundry(false)}
          >
            Foundry VTT (v12) — {rarityLabel}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <div className="max-w-[16rem] px-2 py-1.5">
          <FoundryModuleRequirementsNotice kind="weapon" compact />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
