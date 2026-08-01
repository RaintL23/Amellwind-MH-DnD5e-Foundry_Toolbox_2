import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";
import type { CustomWeapon } from "../types/weapon-forge.types";

interface WeaponForgeExportMenuProps {
  weapon: CustomWeapon;
  /** When set, Foundry export uses this rarity index (dialog). When omitted, shows rarity submenu (list/card). */
  foundryRarityIndex?: number;
  variant?: "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
  triggerLabel?: string;
  onExportAmellwind: (weapon: CustomWeapon) => void;
  onExportFoundry: (weapon: CustomWeapon, rarityIndex: number) => void;
}

export function WeaponForgeExportMenu({
  weapon,
  foundryRarityIndex,
  variant = "ghost",
  size = "sm",
  className,
  triggerLabel = "JSON",
  onExportAmellwind,
  onExportFoundry,
}: WeaponForgeExportMenuProps) {
  const useFixedRarity = typeof foundryRarityIndex === "number";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn(
            size === "sm" && variant === "ghost" && "h-7 px-2",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Download JSON for ${weapon.name}`}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          className="text-xs"
          onSelect={() => onExportAmellwind(weapon)}
        >
          Amellwind JSON
        </DropdownMenuItem>

        {useFixedRarity ? (
          <DropdownMenuItem
            className="text-xs"
            onSelect={() =>
              onExportFoundry(weapon, foundryRarityIndex)
            }
          >
            Foundry VTT (v12)
          </DropdownMenuItem>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs">
              Foundry VTT (v12)
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="text-xs">
              {weapon.rarityRows.length === 0 ? (
                <DropdownMenuItem className="text-xs" disabled>
                  No rarities
                </DropdownMenuItem>
              ) : (
                weapon.rarityRows.map((row, index) => (
                  <DropdownMenuItem
                    key={`${row.rarity}-${index}`}
                    className="text-xs"
                    onSelect={() => onExportFoundry(weapon, index)}
                  >
                    {row.rarity}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
