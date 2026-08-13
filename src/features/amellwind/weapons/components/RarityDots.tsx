import { WeaponRarityRow, RARITY_STYLES } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface RarityDotsProps {
  count: number;
  current: number;
  onSelect: (index: number) => void;
  rows: WeaponRarityRow[];
}

export function RarityDots({ count, current, onSelect, rows }: RarityDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      {Array.from({ length: count }).map((_, i) => {
        const rarity = rows[i]?.rarity ?? "";
        const s = RARITY_STYLES[rarity] ?? RARITY_STYLES["Common"];
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Go to ${rarity}`}
            className={cn(
              "rounded-full transition-all duration-200 border",
              i === current
                ? cn("w-5 h-2.5", s.border, s.badge)
                : "w-2.5 h-2.5 border-border bg-muted/50 hover:bg-muted",
            )}
          />
        );
      })}
    </div>
  );
}
