import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { usePaperDollSelection } from "../hooks/usePaperDollSelection";
import { ItemPickerDialog } from "./ItemPickerDialog";
import { CharacterSelectionDialog } from "./CharacterSelectionDialog";
import { RuneAssignmentPanel } from "./RuneAssignmentPanel";
import { IdentityColumn } from "./paper-doll/IdentityColumn";
import { PaperDollCanvas } from "./paper-doll/PaperDollCanvas";
import { IdentityDetailBar } from "./paper-doll/IdentityDetailBar";
import { WeaponDetailPanel } from "./paper-doll/WeaponDetailPanel";
import { ArmorDetailPanel } from "./paper-doll/ArmorDetailPanel";

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
    equipTrinket,
    setSpecies,
    setBackground,
  } = useCharacterBuilder();

  const {
    pickerSlot,
    identityPicker,
    selectedSlot,
    openEquipmentPicker,
    closeEquipmentPicker,
    openIdentityPicker,
    closeIdentityPicker,
    selectSlot,
    clearSelection,
  } = usePaperDollSelection();

  function handleTrinketSlot(slot: "trinket1" | "trinket2") {
    const trinket = slot === "trinket1" ? trinket1 : trinket2;
    if (!trinket) {
      equipTrinket(slot, `Trinket ${slot === "trinket1" ? "1" : "2"}`);
    }
    selectSlot(slot);
  }

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

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-4 w-full min-w-0 xl:flex-1 xl:min-w-[480px]">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide self-start">
        Equipment
      </h2>

      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-4 justify-center min-w-[300px] mx-auto">
          <IdentityColumn
            species={species}
            background={background}
            selectedSlot={selectedSlot}
            onPickSpecies={() => openIdentityPicker("species")}
            onPickBackground={() => openIdentityPicker("background")}
            onSelectSpecies={() => selectSlot("species")}
            onSelectBackground={() => selectSlot("background")}
          />

          <PaperDollCanvas
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
            onEquip={openEquipmentPicker}
            onSelect={selectSlot}
            onTrinketSlot={handleTrinketSlot}
          />
        </div>
      </div>

      {(selectedSlot === "species" || selectedSlot === "background") && (
        <IdentityDetailBar
          slot={selectedSlot}
          species={species}
          background={background}
          onChange={() =>
            openIdentityPicker(selectedSlot === "species" ? "species" : "background")
          }
          onRemove={() => {
            if (selectedSlot === "species") setSpecies(null);
            else setBackground(null);
            clearSelection();
          }}
        />
      )}

      {selectedWeapon && (selectedSlot === "mainHand" || selectedSlot === "offHand") && (
        <WeaponDetailPanel
          equipped={selectedWeapon}
          onRarityChange={(r) => setWeaponRarity(selectedSlot, r)}
          onVersatileChange={(twoHanded) => setVersatileMode(selectedSlot, twoHanded)}
        />
      )}

      {selectedSlot === "armor" && armor && (
        <ArmorDetailPanel armor={armor} onRarityChange={setArmorRarity} />
      )}

      {showRunePanel && selectedSlot && (
        <div className="w-full min-w-0">
          <RuneAssignmentPanel
            slot={selectedSlot}
            onClose={clearSelection}
          />
        </div>
      )}

      <ItemPickerDialog
        open={pickerSlot !== null}
        slot={pickerSlot}
        onClose={closeEquipmentPicker}
      />

      <CharacterSelectionDialog
        open={identityPicker !== null}
        slot={identityPicker}
        onClose={closeIdentityPicker}
      />
    </div>
  );
}
