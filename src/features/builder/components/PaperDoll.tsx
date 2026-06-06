import { Sword, Users } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import {
  usePaperDollSelection,
  type PaperDollSelection,
} from "../hooks/usePaperDollSelection";
import { RuneAssignmentPanel } from "./RuneAssignmentPanel";
import { WeaponDetailPanel } from "./paper-doll/WeaponDetailPanel";
import { ArmorDetailPanel } from "./paper-doll/ArmorDetailPanel";
import { CharacterStuffGridPanel } from "./CharacterStuffGridPanel";
import { EquipmentGridPanel } from "./EquipmentGridPanel";
import { BuilderItemLibraryPanel } from "./BuilderItemLibraryPanel";
import { BuilderPanel } from "./BuilderPanel";

export function PaperDoll() {
  const {
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
    species,
    background,
    isOffHandBlocked,
    offHandBlockReason,
    hasIntegratedShield,
    integratedShieldAcBonus,
    setWeaponRarity,
    setArmorRarity,
    setVersatileMode,
    setSpecies,
    setBackground,
    unequipWeapon,
    unequipArmor,
    unequipTrinket,
  } = useCharacterBuilder();

  const { selectedSlot, selectSlot, clearSelection } = usePaperDollSelection();

  const selectedWeapon =
    selectedSlot === "mainHand"
      ? mainHand
      : selectedSlot === "offHand"
        ? offHand
        : null;

  const showRunePanel =
    selectedSlot &&
    selectedSlot !== "species" &&
    selectedSlot !== "background" &&
    selectedSlot !== "class" &&
    !(selectedSlot === "offHand" && hasIntegratedShield);

  function isSlotOccupied(slot: PaperDollSelection): boolean {
    if (!slot) return false;
    switch (slot) {
      case "mainHand":
        return !!mainHand;
      case "offHand":
        return !!offHand;
      case "armor":
        return !!armor;
      case "trinket1":
        return !!trinket1;
      case "trinket2":
        return !!trinket2;
      case "species":
        return !!species;
      case "background":
        return !!background;
      default:
        return false;
    }
  }

  function handleUnequipSlot(slot: PaperDollSelection) {
    if (!slot) return;
    switch (slot) {
      case "mainHand":
      case "offHand":
        if (slot === "offHand" && hasIntegratedShield) return;
        unequipWeapon(slot);
        break;
      case "armor":
        unequipArmor();
        break;
      case "trinket1":
      case "trinket2":
        unequipTrinket(slot);
        break;
      case "species":
        setSpecies(null);
        break;
      case "background":
        setBackground(null);
        break;
    }
    selectSlot(slot);
  }

  const showLibrary = selectedSlot && !isSlotOccupied(selectedSlot);

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <BuilderPanel
        title={
          <>
            <Users className="h-3.5 w-3.5" aria-hidden />
            Character Stuff
          </>
        }
        action={
          <span className="text-[11px] text-muted-foreground">
            click to change
          </span>
        }
      >
        <CharacterStuffGridPanel
          species={species}
          background={background}
          selectedSlot={selectedSlot}
          onSelectSlot={selectSlot}
          onUnequipSlot={handleUnequipSlot}
        />
      </BuilderPanel>

      <BuilderPanel
        title={
          <>
            <Sword className="h-3.5 w-3.5" aria-hidden />
            Equipment
          </>
        }
        action={
          <span className="text-[11px] text-muted-foreground">
            click to change
          </span>
        }
      >
        <EquipmentGridPanel
          mainHand={mainHand}
          offHand={offHand}
          armor={armor}
          trinket1={trinket1}
          trinket2={trinket2}
          hasIntegratedShield={hasIntegratedShield}
          integratedShieldAcBonus={integratedShieldAcBonus}
          isOffHandBlocked={isOffHandBlocked}
          offHandBlockReason={offHandBlockReason}
          selectedSlot={selectedSlot}
          onSelectSlot={selectSlot}
          onUnequipSlot={handleUnequipSlot}
        />
      </BuilderPanel>

      {selectedWeapon &&
        (selectedSlot === "mainHand" || selectedSlot === "offHand") && (
          <WeaponDetailPanel
            equipped={selectedWeapon}
            onRarityChange={(r) => setWeaponRarity(selectedSlot, r)}
            onVersatileChange={(twoHanded) =>
              setVersatileMode(selectedSlot, twoHanded)
            }
          />
        )}

      {selectedSlot === "armor" && armor && (
        <ArmorDetailPanel armor={armor} onRarityChange={setArmorRarity} />
      )}

      {showRunePanel && selectedSlot && (
        <RuneAssignmentPanel slot={selectedSlot} onClose={clearSelection} />
      )}

      {showLibrary && <BuilderItemLibraryPanel selectedSlot={selectedSlot} />}
    </div>
  );
}
