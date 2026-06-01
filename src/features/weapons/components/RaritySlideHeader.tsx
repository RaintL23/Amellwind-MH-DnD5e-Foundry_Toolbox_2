import { WeaponRarityRow, RARITY_STYLES } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Layers } from "lucide-react";

interface RaritySlideHeaderProps {
  row: WeaponRarityRow;
  attackBonus?: string;
  styleText: string;
}

export function RaritySlideHeader({
  row,
  attackBonus,
  styleText,
}: RaritySlideHeaderProps) {
  const style = RARITY_STYLES[row.rarity] ?? RARITY_STYLES["Common"];

  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold capitalize",
          style.badge,
        )}
      >
        {row.rarity}
      </span>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {attackBonus && (
          <span className={cn("font-bold text-base", styleText)}>
            {attackBonus} to hit
          </span>
        )}
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {row.slots} slot{row.slots !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
