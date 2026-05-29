import { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface EquipmentSlotProps {
  label: string;
  icon: ReactNode;
  equipped: { name: string; detail?: string } | null;
  onClickEquip: () => void;
  onClickDetails: () => void;
  isSelected: boolean;
}

export function EquipmentSlot({
  label,
  icon,
  equipped,
  onClickEquip,
  onClickDetails,
  isSelected,
}: Readonly<EquipmentSlotProps>) {
  if (!equipped) {
    // Empty slot
    return (
      <button
        onClick={onClickEquip}
        title={`Equip ${label}`}
        className={cn(
          "w-20 h-20 rounded-lg border-2 border-dashed border-border",
          "flex flex-col items-center justify-center gap-1",
          "hover:border-primary/50 hover:bg-primary/5 transition-all",
          "text-muted-foreground hover:text-primary"
        )}
      >
        <Plus className="h-4 w-4" />
        <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
      </button>
    );
  }

  // Equipped slot
  return (
    <div className="relative group">
      <button
        type="button"
        className={cn(
          "w-20 h-20 rounded-lg border-2 cursor-pointer",
          "flex flex-col items-center justify-center gap-0.5 p-1",
          "transition-all",
          isSelected
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 bg-card"
        )}
        onClick={onClickDetails}
      >
        {icon}
        <span className="text-[9px] font-semibold text-foreground leading-tight text-center truncate w-full">
          {equipped.name}
        </span>
        {equipped.detail && (
          <span className="text-[9px] text-muted-foreground">{equipped.detail}</span>
        )}
      </button>
      {/* Unequip button */}
      <button
        type="button"
        onClick={onClickEquip}
        className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Change item"
      >
        <X className="h-3 w-3 text-destructive-foreground" />
      </button>
    </div>
  );
}
