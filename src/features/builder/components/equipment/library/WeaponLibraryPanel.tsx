import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import { checkWeaponProficiency } from "@/features/builder/utils/equipment-proficiency.utils";
import {
  getOffHandWeaponBlockLabel,
  getOffHandWeaponBlockReason,
  isOffHandWeaponPickerAvailable,
} from "@/features/weapons/utils/weapon-hands.utils";
import { buildWeaponInventoryBundle } from "@/features/builder/utils/equipment-inventory.utils";
import type { Weapon } from "@/shared/types";
import { WeaponLibraryDetail } from "./WeaponLibraryDetail";
import { WeaponList } from "./shared/LibraryLists";

interface WeaponLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
  q: string;
}

export function WeaponLibraryPanel({ selectedSlot, q }: WeaponLibraryPanelProps) {
  const [allWeapons, setAllWeapons] = useState<Weapon[]>([]);
  const [weaponsLoading, setWeaponsLoading] = useState(false);

  const {
    mainHand,
    offHand,
    equippedShield,
    hasIntegratedShield,
    isOffHandBlocked,
    class: classSelection,
    equipWeapon,
    setVersatileMode,
    resolvedWeaponItems,
    resolvedArmorItems,
  } = useCharacterBuilder();

  const { weapons: inventoryWeapons, addEquipmentBundle } = useBuilderInventory();

  const isWeaponSlot =
    selectedSlot === "mainHand" || selectedSlot === "offHand";

  useEffect(() => {
    if (!isWeaponSlot) return;
    setWeaponsLoading(true);
    getAllWeapons()
      .then(setAllWeapons)
      .finally(() => setWeaponsLoading(false));
  }, [isWeaponSlot, selectedSlot]);

  const inventoryWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];
    return inventoryWeapons.filter((w) => w.name.toLowerCase().includes(q));
  }, [inventoryWeapons, isWeaponSlot, q]);

  const catalogWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];
    const invNames = new Set(inventoryWeapons.map((w) => w.name));
    return allWeapons.filter(
      (w) => w.name.toLowerCase().includes(q) && !invNames.has(w.name),
    );
  }, [allWeapons, inventoryWeapons, isWeaponSlot, q]);

  const equippedWeapon =
    selectedSlot === "mainHand"
      ? mainHand
      : selectedSlot === "offHand"
        ? offHand
        : null;

  const showOffHandWeaponPicker =
    selectedSlot === "offHand" &&
    isOffHandWeaponPickerAvailable(
      offHand,
      equippedShield,
      hasIntegratedShield,
      isOffHandBlocked,
    );

  const showWeaponDetail =
    isWeaponSlot &&
    !!equippedWeapon &&
    !(selectedSlot === "offHand" && showOffHandWeaponPicker);

  const getWeaponDisabledReason = useCallback(
    (weapon: Weapon): string | null => {
      if (!classSelection) return null;

      const proficiencyCheck = checkWeaponProficiency(
        weapon.name,
        resolvedWeaponItems,
        resolvedArmorItems,
      );
      if (!proficiencyCheck.allowed) {
        return proficiencyCheck.reason ?? "Your class is not proficient with this weapon.";
      }

      if (selectedSlot === "offHand") {
        if (hasIntegratedShield) {
          return "La mano secundaria está ocupada por el escudo integrado";
        }
        if (
          !isOffHandWeaponPickerAvailable(
            offHand,
            equippedShield,
            hasIntegratedShield,
            isOffHandBlocked,
          )
        ) {
          return "La mano secundaria no está disponible";
        }
        const offHandReason = getOffHandWeaponBlockReason(weapon);
        if (offHandReason) {
          return getOffHandWeaponBlockLabel(offHandReason);
        }
      }

      return null;
    },
    [
      classSelection,
      resolvedArmorItems,
      resolvedWeaponItems,
      selectedSlot,
      hasIntegratedShield,
      offHand,
      equippedShield,
      isOffHandBlocked,
    ],
  );

  function handleSelectWeapon(weapon: Weapon) {
    if (!isWeaponSlot || !selectedSlot) return;
    equipWeapon(selectedSlot, weapon, "Common");
    addEquipmentBundle(buildWeaponInventoryBundle(weapon));
  }

  if (!isWeaponSlot) return null;

  if (showWeaponDetail) {
    return (
      <WeaponLibraryDetail
        equipped={equippedWeapon}
        weaponProficiencies={resolvedWeaponItems}
        onModeChange={(useSecondaryMode) => {
          if (selectedSlot === "mainHand" || selectedSlot === "offHand") {
            setVersatileMode(selectedSlot, useSecondaryMode);
          }
        }}
      />
    );
  }

  return (
    <WeaponList
      inventory={inventoryWeaponsFiltered}
      catalog={catalogWeaponsFiltered}
      loading={weaponsLoading}
      equipped={equippedWeapon?.weapon.name ?? null}
      weaponProficiencies={resolvedWeaponItems}
      onSelect={handleSelectWeapon}
      getDisabledReason={getWeaponDisabledReason}
    />
  );
}
