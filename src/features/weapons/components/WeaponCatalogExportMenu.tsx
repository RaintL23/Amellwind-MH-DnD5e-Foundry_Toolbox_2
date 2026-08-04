import { Download } from "lucide-react";
import type { Weapon } from "@/shared/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  downloadFoundryJson,
  FoundryModuleRequirementsNotice,
  type FoundryItem,
} from "@/shared/foundry";
import { foundryItemFilename } from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";
import { weaponToExportCustomWeapon } from "../services/weapon-foundry-export.service";

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
        <DropdownMenuItem
          className="text-xs"
          onSelect={() =>
            downloadFoundryJson(
              item,
              foundryItemFilename(
                weaponToExportCustomWeapon(weapon),
                rarityIndex,
              ),
            )
          }
        >
          Foundry VTT (v12) —{" "}
          {weapon.rarityRows[rarityIndex]?.rarity ?? "rarity"}
        </DropdownMenuItem>
        <div className="max-w-[16rem] border-t border-border px-2 py-1.5">
          <FoundryModuleRequirementsNotice kind="weapon" compact />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
