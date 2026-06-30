import { useCallback, useEffect, useMemo, useState } from "react";

import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import { getDndWeapons } from "@/features/dnd-items/services/dnd-equipment.service";
import { resolveRpgbotContext } from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/builder/hooks/useRpgbotRatingsLookup";
import { weaponsToSourceVariants } from "@/features/dnd-items/mappers/dnd-weapon.mapper";
import { useDndWeaponVariants } from "@/features/builder/hooks/useDndWeaponVariants";

import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";

import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";

import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";

import { checkWeaponProficiency } from "@/features/builder/utils/equipment-proficiency.utils";

import { useSelectedClass } from "@/features/builder/hooks/useBuilderSelections";

import {
  getOffHandWeaponBlockLabel,
  getOffHandWeaponBlockReason,
  isOffHandSlotOccupied,
  isOffHandWeaponPickerAvailable,
} from "@/features/weapons/utils/weapon-hands.utils";

import { buildWeaponInventoryBundle } from "@/features/builder/utils/equipment-inventory.utils";

import { matchesEquipmentRarityFilter } from "@/features/builder/utils/dnd-rarity.utils";

import type { EquipmentRarityFilter } from "@/features/builder/utils/dnd-rarity.utils";

import type { Weapon } from "@/shared/types";

import { WeaponLibraryDetail } from "./WeaponLibraryDetail";

import { WeaponList } from "./shared/LibraryLists";

interface WeaponLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;

  q: string;

  rarityFilter?: EquipmentRarityFilter;
}

function getWeaponRarityLabel(weapon: Weapon): string {
  return weapon.itemRarityLabel ?? "Standard";
}

export function WeaponLibraryPanel({
  selectedSlot,

  q,

  rarityFilter = "Standard",
}: WeaponLibraryPanelProps) {
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

    useAmellwindHomebrew,
  } = useCharacterBuilder();

  const { classData } = useSelectedClass();

  const { weapons: inventoryWeapons, addEquipmentBundle } =
    useBuilderInventory();

  const isWeaponSlot =
    selectedSlot === "mainHand" || selectedSlot === "offHand";

  const prefer2024 = classData?.source === "XPHB";

  const rpgbotWeaponContext = useMemo(
    () =>
      resolveRpgbotContext({
        className: classSelection?.name,
        guideKey: "class",
        category: "weapon",
      }),
    [classSelection?.name],
  );

  const { lookup: rpgbotWeaponLookup, ready: rpgbotWeaponReady } =
    useRpgbotRatingsLookup(rpgbotWeaponContext);

  useEffect(() => {
    if (!isWeaponSlot) return;

    setWeaponsLoading(true);

    const load = useAmellwindHomebrew
      ? getAllWeapons()
      : getDndWeapons(prefer2024);

    load.then(setAllWeapons).finally(() => setWeaponsLoading(false));
  }, [isWeaponSlot, selectedSlot, useAmellwindHomebrew, prefer2024]);

  const matchesRarity = useCallback(
    (weapon: Weapon) => {
      if (useAmellwindHomebrew) return true;

      return matchesEquipmentRarityFilter(
        getWeaponRarityLabel(weapon),

        rarityFilter,
      );
    },

    [rarityFilter, useAmellwindHomebrew],
  );

  const inventoryWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];

    return inventoryWeapons.filter(
      (w) => w.name.toLowerCase().includes(q) && matchesRarity(w),
    );
  }, [inventoryWeapons, isWeaponSlot, q, matchesRarity]);

  const catalogWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];

    const invNames = new Set(inventoryWeapons.map((w) => w.name));

    return allWeapons.filter(
      (w) =>
        w.name.toLowerCase().includes(q) &&
        !invNames.has(w.name) &&
        matchesRarity(w),
    );
  }, [allWeapons, inventoryWeapons, isWeaponSlot, q, matchesRarity]);

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

  const dndWeaponVariants = useDndWeaponVariants(
    !useAmellwindHomebrew && !!equippedWeapon,
    equippedWeapon?.weapon.name,
  );

  const dndSourceVariants = useMemo(
    () => weaponsToSourceVariants(dndWeaponVariants),
    [dndWeaponVariants],
  );

  const handleSourceChange = useCallback(
    (variantId: string) => {
      if (!isWeaponSlot || !selectedSlot) return;
      const variant = dndWeaponVariants.find((w) => w.id === variantId);
      if (!variant) return;
      const rarity = variant.itemRarityLabel ?? "Standard";
      equipWeapon(selectedSlot, variant, rarity);
    },
    [dndWeaponVariants, equipWeapon, isWeaponSlot, selectedSlot],
  );

  const getWeaponDisabledReason = useCallback(
    (weapon: Weapon): string | null => {
      if (!classSelection) return null;

      const proficiencyCheck = checkWeaponProficiency(
        weapon.name,

        resolvedWeaponItems,

        resolvedArmorItems,

        weapon,
      );

      if (!proficiencyCheck.allowed) {
        return (
          proficiencyCheck.reason ??
          "Your class is not proficient with this weapon."
        );
      }

      if (selectedSlot === "offHand") {
        if (hasIntegratedShield) {
          return "The off-hand is occupied by the integrated shield";
        }

        if (
          !isOffHandWeaponPickerAvailable(
            offHand,

            equippedShield,

            hasIntegratedShield,

            isOffHandBlocked,
          )
        ) {
          return "The off-hand is not available";
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

    const rarity = useAmellwindHomebrew
      ? "Common"
      : (weapon.itemRarityLabel ?? "Standard");

    equipWeapon(selectedSlot, weapon, rarity);

    addEquipmentBundle(buildWeaponInventoryBundle(weapon));
  }

  if (!isWeaponSlot) return null;

  if (showWeaponDetail) {
    const gripContext =
      selectedSlot === "mainHand" || selectedSlot === "offHand"
        ? {
            weaponSlot: selectedSlot,
            offHandOccupied: isOffHandSlotOccupied(
              offHand,
              equippedShield,
              hasIntegratedShield,
            ),
            mainHandOccupied: !!mainHand,
          }
        : undefined;

    return (
      <WeaponLibraryDetail
        equipped={equippedWeapon}
        gripContext={gripContext}
        weaponProficiencies={resolvedWeaponItems}
        showHomebrewDetails={useAmellwindHomebrew}
        sourceVariants={!useAmellwindHomebrew ? dndSourceVariants : undefined}
        activeSourceId={equippedWeapon.weapon.id}
        onSourceChange={!useAmellwindHomebrew ? handleSourceChange : undefined}
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
      rpgbotLookup={rpgbotWeaponReady ? rpgbotWeaponLookup : null}
    />
  );
}
