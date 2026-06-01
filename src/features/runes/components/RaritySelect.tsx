import { ChevronDown } from "lucide-react";
import {
  RARITY_ORDER,
  RARITY_SLOTS,
  ItemRarity,
} from "../context/RuneBuildContext";
import { RARITY_COLOR, RARITY_LABEL } from "../constants/rune.constants";
import { cn } from "@/shared/utils/cn";

interface RaritySelectProps {
  value: ItemRarity;
  onChange: (r: ItemRarity) => void;
  label: string;
}

export function RaritySelect({ value, onChange, label }: RaritySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}:</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ItemRarity)}
          className={cn(
            "appearance-none rounded-md border border-border bg-muted/30 px-2 py-1 pr-6 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary",
            RARITY_COLOR[value],
          )}
        >
          {RARITY_ORDER.map((r) => (
            <option key={r} value={r}>
              {RARITY_LABEL[r]} ({RARITY_SLOTS[r]} slot{RARITY_SLOTS[r] > 1 ? "s" : ""})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
}
