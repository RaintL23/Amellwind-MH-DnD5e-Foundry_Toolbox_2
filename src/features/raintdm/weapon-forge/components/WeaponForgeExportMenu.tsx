import type { SyntheticEvent } from "react";
import { ChevronDown, Download, FileJson, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";
import type { CustomWeapon } from "../types/weapon-forge.types";
import {
  exportWeaponFoundryJson,
  exportWeaponJson,
} from "../services/weapon-forge.service";

interface WeaponForgeExportMenuProps {
  weapon: CustomWeapon;
  variant?: "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
  triggerLabel?: string;
  /** Rarity currently shown in the dialog — marked in the Foundry submenu. */
  preferredRarityIndex?: number;
}

export function WeaponForgeExportMenu({
  weapon,
  variant = "ghost",
  size = "sm",
  className,
  triggerLabel = "JSON",
  preferredRarityIndex,
}: WeaponForgeExportMenuProps) {
  const rarities = weapon.rarityRows;
  const hasMultipleRarities = rarities.length > 1;

  function stopCardClick(e: SyntheticEvent) {
    e.stopPropagation();
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn(
            size === "sm" && variant === "ghost" && "h-7 px-2",
            className,
          )}
          onClick={stopCardClick}
          onPointerDown={stopCardClick}
          aria-label={`Download JSON for ${weapon.name}`}
          aria-haspopup="menu"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          {triggerLabel}
          <ChevronDown className="h-3 w-3 ml-0.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64"
        onClick={stopCardClick}
        onPointerDown={stopCardClick}
      >
        <DropdownMenuItem
          className="items-start gap-2"
          onSelect={() => exportWeaponJson(weapon)}
        >
          <Hammer className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex min-w-0 flex-col">
            <span>Forge JSON</span>
            <span className="text-xs font-normal text-muted-foreground">
              Catalog format (raintdm-weapons)
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {hasMultipleRarities ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <FileJson className="h-4 w-4" />
              Foundry VTT JSON
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[12rem]">
              {rarities.map((row, index) => (
                <DropdownMenuItem
                  key={`${row.rarity}-${index}`}
                  onSelect={() => exportWeaponFoundryJson(weapon, index)}
                >
                  {row.rarity}
                  {index === preferredRarityIndex ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      current
                    </span>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem
            className="items-start gap-2"
            onSelect={() => exportWeaponFoundryJson(weapon, 0)}
          >
            <FileJson className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex min-w-0 flex-col">
              <span>Foundry VTT JSON</span>
              <span className="text-xs font-normal text-muted-foreground">
                {rarities[0]?.rarity
                  ? `Item for ${rarities[0].rarity}`
                  : "dnd5e v12 item"}
              </span>
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
