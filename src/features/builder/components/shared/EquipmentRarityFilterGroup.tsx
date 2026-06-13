import { cn } from "@/shared/utils/cn";
import { RARITY_BADGE } from "../equipment/library/constants";
import {
  EQUIPMENT_RARITY_FILTERS,
  type EquipmentRarityFilter,
} from "@/features/builder/utils/dnd-rarity.utils";

interface EquipmentRarityFilterGroupProps {
  value: EquipmentRarityFilter;
  onChange: (rarity: EquipmentRarityFilter) => void;
}

export function EquipmentRarityFilterGroup({
  value,
  onChange,
}: EquipmentRarityFilterGroupProps) {
  return (
    <div className="flex flex-wrap gap-1 normal-case">
      {EQUIPMENT_RARITY_FILTERS.map((rarity) => {
        const isSelected = value === rarity;
        const badgeClass = RARITY_BADGE[rarity];
        return (
          <button
            key={rarity}
            type="button"
            onClick={() => onChange(rarity)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
              isSelected
                ? cn("border-primary/60", badgeClass ?? "bg-primary/15 text-primary")
                : cn(
                    "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground",
                    !isSelected && badgeClass && "opacity-70",
                  ),
            )}
          >
            {rarity}
          </button>
        );
      })}
    </div>
  );
}
