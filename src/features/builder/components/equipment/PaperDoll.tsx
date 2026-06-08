import { Sword, Users } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import {
  usePaperDollSelection,
  type PaperDollSelection,
} from "../../hooks/usePaperDollSelection";
import { useSelectedClass } from "../../hooks/useSelectedClass";
import {
  isFeatSlotSelection,
  isSubclassLevelReached,
  parseFeatSlotIndex,
} from "../../utils/builder-class.utils";
import { useEffect } from "react";
import { RuneAssignmentPanel } from "./RuneAssignmentPanel";
import { WeaponDetailPanel } from "./WeaponDetailPanel";
import { ArmorDetailPanel } from "./ArmorDetailPanel";
import { CharacterStuffGridPanel } from "./CharacterStuffGridPanel";
import { EquipmentGridPanel } from "./EquipmentGridPanel";
import { BuilderItemLibraryPanel } from "./BuilderItemLibraryPanel";
import { BackstoryNotesPanel } from "./BackstoryNotesPanel";
import { BuilderPanel } from "../shared/BuilderPanel";

export function PaperDoll() {
  const {
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
    character,
    species,
    background,
    class: classSelection,
    subclass,
    featSelections,
    speciesOriginFeatGrant,
    speciesOriginFeat,
    backgroundOriginFeatGrant,
    backgroundOriginFeat,
    backstoryNotes,
    isOffHandBlocked,
    offHandBlockReason,
    hasIntegratedShield,
    integratedShieldAcBonus,
    setWeaponRarity,
    setArmorRarity,
    setVersatileMode,
    setSpecies,
    setBackground,
    setClass,
    setSubclass,
    setFeatAtIndex,
    setSpeciesOriginFeat,
    unequipWeapon,
    unequipArmor,
    unequipTrinket,
  } = useCharacterBuilder();

  const { selectedSlot, selectSlot, clearSelection } = usePaperDollSelection();
  const { classData } = useSelectedClass();

  useEffect(() => {
    // Wait until class data loads — clearing while classData is null would
    // wipe a valid subclass when returning from another route.
    if (!classData) return;
    if (!isSubclassLevelReached(classData, character.level) && subclass) {
      setSubclass(null);
    }
  }, [classData, character.level, subclass, setSubclass]);

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
    selectedSlot !== "backstory" &&
    selectedSlot !== "class" &&
    selectedSlot !== "subclass" &&
    selectedSlot !== "origin-feat" &&
    !isFeatSlotSelection(selectedSlot) &&
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
      case "class":
        return !!classSelection;
      case "subclass":
        return !!subclass;
      case "origin-feat":
        return (
          !!speciesOriginFeat ||
          !!backgroundOriginFeat ||
          speciesOriginFeatGrant?.kind === "fixed" ||
          backgroundOriginFeatGrant?.kind === "fixed"
        );
      default:
        if (isFeatSlotSelection(slot)) {
          const index = parseFeatSlotIndex(slot);
          return !!featSelections[index];
        }
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
      case "class":
        setClass(null);
        break;
      case "subclass":
        setSubclass(null);
        break;
      case "origin-feat":
        if (speciesOriginFeatGrant?.kind === "choose") {
          setSpeciesOriginFeat(null);
        }
        break;
      default:
        if (isFeatSlotSelection(slot)) {
          setFeatAtIndex(parseFeatSlotIndex(slot), null);
        }
        break;
    }
    selectSlot(slot);
  }

  const showBackstoryPanel = selectedSlot === "backstory";
  const showLibrary =
    selectedSlot &&
    selectedSlot !== "backstory" &&
    (!isSlotOccupied(selectedSlot) ||
      selectedSlot === "species" ||
      selectedSlot === "background" ||
      selectedSlot === "class" ||
      selectedSlot === "subclass" ||
      selectedSlot === "origin-feat" ||
      isFeatSlotSelection(selectedSlot) ||
      selectedSlot === "mainHand" ||
      selectedSlot === "offHand" ||
      selectedSlot === "armor");

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
          classSelection={classSelection}
          subclass={subclass}
          classData={classData}
          level={character.level}
          featSelections={featSelections}
          speciesOriginFeatGrant={speciesOriginFeatGrant}
          speciesOriginFeat={speciesOriginFeat}
          backgroundOriginFeatGrant={backgroundOriginFeatGrant}
          backgroundOriginFeat={backgroundOriginFeat}
          backstoryNotes={backstoryNotes}
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

      {showBackstoryPanel && <BackstoryNotesPanel />}

      {showLibrary && <BuilderItemLibraryPanel selectedSlot={selectedSlot} />}
    </div>
  );
}
