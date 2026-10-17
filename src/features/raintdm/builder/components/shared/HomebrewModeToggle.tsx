import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { BACKGROUND_FACTION_LABELS } from "@/shared/types";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import {
  isAmellwindBackgroundSelection,
  isAmellwindSpeciesSelection,
  isAmellwindWeapon,
} from "../../utils/homebrew-cleanup.utils";

export function HomebrewModeToggle() {
  const {
    useAmellwindHomebrew,
    setUseAmellwindHomebrew,
    species,
    background,
    faction,
    featSelections,
    mainHand,
    offHand,
    trinket1,
    trinket2,
  } = useCharacterBuilder();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [lossItems, setLossItems] = useState<string[]>([]);

  // Mirrors what turning Homebrew off actually clears (see clearAmellwindIdentity
  // and clearHomebrewEquipment): D&D species/backgrounds and weapons are kept.
  async function buildLossItems(): Promise<string[]> {
    const items: string[] = [];
    const [amellwindSpecies, amellwindBackground] = await Promise.all([
      species ? isAmellwindSpeciesSelection(species) : false,
      background ? isAmellwindBackgroundSelection(background) : false,
    ]);
    if (species && amellwindSpecies) items.push(`Species: ${species.name}`);
    if (background && amellwindBackground) {
      items.push(`Background: ${background.name}`);
    }
    if (faction) items.push(`Faction: ${BACKGROUND_FACTION_LABELS[faction]}`);
    if (featSelections.some((feat) => feat?.source === "amellwind")) {
      items.push("Amellwind feats");
    }
    if (mainHand && isAmellwindWeapon(mainHand.weapon)) {
      items.push(`Main hand: ${mainHand.weapon.name}`);
    }
    if (offHand && isAmellwindWeapon(offHand.weapon)) {
      items.push(`Off hand: ${offHand.weapon.name}`);
    }
    if (trinket1) items.push(`Trinket: ${trinket1.name}`);
    if (trinket2) items.push(`Trinket: ${trinket2.name}`);
    items.push("Amellwind runes and rarities on equipped gear");
    return items;
  }

  function handleCheckedChange(checked: boolean) {
    if (useAmellwindHomebrew && !checked) {
      void buildLossItems().then((items) => {
        setLossItems(items);
        setConfirmOpen(true);
      });
      return;
    }
    setUseAmellwindHomebrew(checked);
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2">
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
            <span className="hidden sm:inline">Amellwind </span>Homebrew
          </span>
          <span className="hidden text-[11px] font-normal text-muted-foreground sm:block">
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
        lossItems={lossItems}
        confirmLabel="Turn off Homebrew"
        onConfirm={() => {
          setUseAmellwindHomebrew(false);
          toast.message("Amellwind Homebrew disabled");
        }}
      />
    </>
  );
}
