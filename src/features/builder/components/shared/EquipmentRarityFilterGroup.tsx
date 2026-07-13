import { cn } from "@/shared/utils/cn";
import { PillToggleGroup, type PillToggleOption } from "./PillToggleGroup";
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
  const options: PillToggleOption<EquipmentRarityFilter>[] =
    EQUIPMENT_RARITY_FILTERS.map((rarity) => {
      const badgeClass = RARITY_BADGE[rarity];
      return {
        id: rarity,
        label: rarity,
        // Selected pills wear the rarity's own badge color; inactive coloured
        // pills are dimmed so the active one stands out.
        activeClassName: cn(
          "border-primary/60",
          badgeClass ?? "bg-primary/15 text-primary",
        ),
        inactiveClassName: badgeClass ? "opacity-70" : undefined,
      };
    });

  return <PillToggleGroup options={options} value={value} onChange={onChange} />;
}
