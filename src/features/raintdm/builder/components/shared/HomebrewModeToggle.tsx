import { cn } from "@/shared/utils/cn";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";

export function HomebrewModeToggle() {
  const { useAmellwindHomebrew, setUseAmellwindHomebrew } = useCharacterBuilder();

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2">
      <Switch
        id="homebrew-mode"
        checked={useAmellwindHomebrew}
        onCheckedChange={setUseAmellwindHomebrew}
      />
      <Label
        htmlFor="homebrew-mode"
        className="flex flex-1 cursor-pointer flex-col gap-0.5"
      >
        <span className="text-xs font-medium text-foreground">
          Amellwind Homebrew
        </span>
        <span className="text-[10px] font-normal text-muted-foreground">
          {useAmellwindHomebrew
            ? "MH content, runes, trinkets, and rarities enabled"
            : "D&D 5e only — standard weapons and gear"}
        </span>
      </Label>
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
    </div>
  );
}
