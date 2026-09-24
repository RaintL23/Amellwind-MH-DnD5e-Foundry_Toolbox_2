import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

export function HomebrewModeToggle() {
  const {
    useAmellwindHomebrew,
    setUseAmellwindHomebrew,
    species,
    background,
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
  } = useCharacterBuilder();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function buildLossItems(): string[] {
    const items: string[] = [];
    if (species) items.push(`Species: ${species.name}`);
    if (background) items.push(`Background: ${background.name}`);
    if (mainHand) items.push(`Main hand: ${mainHand.weapon.name}`);
    if (offHand) items.push(`Off hand: ${offHand.weapon.name}`);
    if (armor) items.push(`Armor: ${armor.armor.name}`);
    if (trinket1) items.push(`Trinket: ${trinket1.name}`);
    if (trinket2) items.push(`Trinket: ${trinket2.name}`);
    items.push("Amellwind runes and rarities on equipped gear");
    return items;
  }

  function handleCheckedChange(checked: boolean) {
    if (useAmellwindHomebrew && !checked) {
      setConfirmOpen(true);
      return;
    }
    setUseAmellwindHomebrew(checked);
  }

  return (
    <>
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2">
        <Switch
          id="homebrew-mode"
          checked={useAmellwindHomebrew}
          onCheckedChange={handleCheckedChange}
        />
        <Label
          htmlFor="homebrew-mode"
          className="flex flex-1 cursor-pointer flex-col gap-0.5"
        >
          <span className="text-xs font-medium text-foreground">
            Amellwind Homebrew
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
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

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Turn off Amellwind Homebrew?"
        description="Switching to D&D 5e only will clear Amellwind-specific identity and equipment from this build."
        lossItems={buildLossItems()}
        confirmLabel="Turn off Homebrew"
        onConfirm={() => {
          setUseAmellwindHomebrew(false);
          toast.message("Amellwind Homebrew disabled");
        }}
      />
    </>
  );
}
