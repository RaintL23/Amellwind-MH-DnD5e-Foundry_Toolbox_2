import { AlertTriangle } from "lucide-react";
import { RARITY_ORDER } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import {
  exceedsStartingRarity,
  getStartingRarityCeiling,
} from "../../utils/rarity-guideline.utils";

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
  const { character } = useCharacterBuilder();
  const level = character.level;
  const aboveGuideline = exceedsStartingRarity(value, level);

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
      {aboveGuideline && (
        <p className="flex items-start gap-1 text-[10px] leading-snug text-amber-400">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden />
          <span>
            Above the Amellwind starting guideline for level {level} (up to{" "}
            {getStartingRarityCeiling(level)}). Higher rarities come from
            upgrading at a smithy — fine for experimenting, your DM decides.
          </span>
        </p>
      )}
    </div>
  );
}
