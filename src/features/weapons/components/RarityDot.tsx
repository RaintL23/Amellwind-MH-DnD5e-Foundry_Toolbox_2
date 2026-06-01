import { cn } from "@/shared/utils/cn";

const DOT_COLORS: Record<string, string> = {
  Common: "bg-gray-500",
  Uncommon: "bg-green-500",
  Rare: "bg-blue-500",
  "Very Rare": "bg-purple-500",
  Legendary: "bg-amber-500",
};

interface RarityDotProps {
  rarity: string;
}

export function RarityDot({ rarity }: RarityDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0 mt-1.5",
        DOT_COLORS[rarity] ?? "bg-gray-500",
      )}
      title={rarity}
    />
  );
}
