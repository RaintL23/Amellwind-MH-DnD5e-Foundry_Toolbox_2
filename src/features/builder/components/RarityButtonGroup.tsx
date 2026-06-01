import { RARITY_ORDER } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface RarityButtonGroupProps {
  value: string;
  onChange: (rarity: string) => void;
  label?: string;
}

export function RarityButtonGroup({
  value,
  onChange,
  label = "Rarity",
}: RarityButtonGroupProps) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] text-muted-foreground font-medium uppercase">
        {label}
      </span>
      <div className="flex gap-1 flex-wrap">
        {RARITY_ORDER.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              "px-2 py-0.5 text-xs rounded border transition-colors",
              value === r
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
