import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { CustomWeapon } from "../types/weapon-forge.types";

interface WeaponForgeExportMenuProps {
  weapon: CustomWeapon;
  variant?: "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
  triggerLabel?: string;
  onExportAmellwind: (weapon: CustomWeapon) => void;
}

export function WeaponForgeExportMenu({
  weapon,
  variant = "ghost",
  size = "sm",
  className,
  triggerLabel = "JSON",
  onExportAmellwind,
}: WeaponForgeExportMenuProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        size === "sm" && variant === "ghost" && "h-7 px-2",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        onExportAmellwind(weapon);
      }}
      aria-label={`Download Amellwind JSON for ${weapon.name}`}
    >
      <Download className="h-3.5 w-3.5 mr-1" />
      {triggerLabel}
    </Button>
  );
}
