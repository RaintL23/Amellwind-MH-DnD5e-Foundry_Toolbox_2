import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";

export function HomebrewModeToggle() {
  const { useAmellwindHomebrew, setUseAmellwindHomebrew } = useCharacterBuilder();

  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2">
      <input
        type="checkbox"
        checked={useAmellwindHomebrew}
        onChange={(e) => setUseAmellwindHomebrew(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-primary"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-foreground">
          Amellwind Homebrew
        </span>
        <span className="text-[10px] text-muted-foreground">
          {useAmellwindHomebrew
            ? "MH content, runes, trinkets, and rarities enabled"
            : "D&D 5e only — standard weapons and gear"}
        </span>
      </span>
      <span
        className={cn(
          "ml-1 hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline",
          useAmellwindHomebrew
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {useAmellwindHomebrew ? "ON" : "OFF"}
      </span>
    </label>
  );
}
