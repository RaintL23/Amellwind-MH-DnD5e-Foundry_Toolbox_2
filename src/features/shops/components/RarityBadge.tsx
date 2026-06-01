import { cn } from "@/shared/utils/cn";
import { RARITY_COLORS } from "../constants/item.constants";

export function RarityBadge({ rarity }: { rarity: string }) {
  const r = rarity.toLowerCase();
  if (r === "none") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
        RARITY_COLORS[r] ?? RARITY_COLORS["none"],
      )}
    >
      {rarity}
    </span>
  );
}
