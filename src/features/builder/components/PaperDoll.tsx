import { Sword } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { usePaperDollSelection } from "../hooks/usePaperDollSelection";
import { RuneAssignmentPanel } from "./RuneAssignmentPanel";
import { IdentityDetailBar } from "./paper-doll/IdentityDetailBar";
import { WeaponDetailPanel } from "./paper-doll/WeaponDetailPanel";
import { ArmorDetailPanel } from "./paper-doll/ArmorDetailPanel";
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

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <BuilderPanel
        title={
          <>
            <Sword className="h-3.5 w-3.5" aria-hidden />
            Equipamiento
          </>
        }
        action={
          <span className="text-[11px] text-muted-foreground">clic para cambiar</span>
        }
      >
        <EquipmentGridPanel
          mainHand={mainHand}
          offHand={offHand}
          armor={armor}
          trinket1={trinket1}
          trinket2={trinket2}
          species={species}
          background={background}
          hasIntegratedShield={hasIntegratedShield}
          integratedShieldAcBonus={integratedShieldAcBonus}
          isOffHandBlocked={isOffHandBlocked}
          offHandBlockReason={offHandBlockReason}
          selectedSlot={selectedSlot}
          onSelectSlot={selectSlot}
        />
      </BuilderPanel>

      {(selectedSlot === "species" || selectedSlot === "background") && (
        <IdentityDetailBar
          slot={selectedSlot}
          species={species}
          background={background}
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
        <RuneAssignmentPanel slot={selectedSlot} onClose={clearSelection} />
      )}

      <BuilderItemLibraryPanel selectedSlot={selectedSlot} />
    </div>
  );
}

