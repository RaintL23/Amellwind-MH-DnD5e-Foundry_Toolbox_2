import { useCallback, useEffect, useMemo, useState } from "react";

import { getAllWeapons } from "@/features/amellwind/weapons/services/weapon.service";
import { getDndWeapons } from "@/features/dnd/items/services/dnd-equipment.service";
import { getAllForgeWeapons } from "@/features/raintdm/weapon-forge/services/weapon-forge.service";
import { isWeaponForgeWeapon } from "@/features/raintdm/weapon-forge/utils/is-forge-weapon";
import { resolveRpgbotContext } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/raintdm/builder/hooks/useRpgbotRatingsLookup";
import { weaponsToSourceVariants } from "@/features/dnd/items/mappers/dnd-weapon.mapper";
import { useDndWeaponVariants } from "@/features/raintdm/builder/hooks/useDndWeaponVariants";

import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";

import { useBuilderInventory } from "@/features/raintdm/builder/context/BuilderInventoryContext";

import type { BuilderSlotSelection } from "@/features/raintdm/builder/hooks/useBuilderSlotSelection";

import { checkWeaponProficiency } from "@/features/raintdm/builder/utils/equipment-proficiency.utils";

import { useSelectedClass } from "@/features/raintdm/builder/hooks/useBuilderSelections";

import {
  getOffHandWeaponBlockLabel,
  getOffHandWeaponBlockReason,
  isOffHandSlotOccupied,
  isOffHandWeaponPickerAvailable,
} from "@/features/amellwind/weapons/utils/weapon-hands.utils";

import { buildWeaponInventoryBundle } from "@/features/raintdm/builder/utils/equipment-inventory.utils";

import { weaponMatchesLibraryFilters } from "@/features/raintdm/builder/utils/builder-library-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";

import type { Weapon } from "@/shared/types";
import type { WeaponLibraryCatalog } from "@/features/raintdm/builder/utils/builder-library-filters";

import { WeaponLibraryDetail } from "./WeaponLibraryDetail";

import { WeaponList } from "./shared/LibraryLists";

function weaponMatchesLibraryCatalog(
  weapon: Weapon,
  catalog: WeaponLibraryCatalog,
): boolean {
  const isForge = isWeaponForgeWeapon(weapon);
  return catalog === "forge" ? isForge : !isForge;
}

interface WeaponLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;

  q: string;

  listFilters?: ListFilterValues;

  /** Only used while Amellwind Homebrew is on. Defaults to forge. */
  weaponCatalog?: WeaponLibraryCatalog;
}

export function WeaponLibraryPanel({
  selectedSlot,

  q,

  listFilters = {},

  weaponCatalog = "forge",
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

    setWeaponMode,

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

    let load: Promise<Weapon[]>;
    if (!useAmellwindHomebrew) {
      load = getDndWeapons(prefer2024);
    } else if (weaponCatalog === "forge") {
      load = getAllForgeWeapons();
    } else {
      load = getAllWeapons();
    }

    load.then(setAllWeapons).finally(() => setWeaponsLoading(false));
  }, [
    isWeaponSlot,
    selectedSlot,
    useAmellwindHomebrew,
    prefer2024,
    weaponCatalog,
  ]);

  const effectiveListFilters = useMemo(
    () => (useAmellwindHomebrew ? { ...listFilters, rarity: "" } : listFilters),
    [useAmellwindHomebrew, listFilters],
  );

  const inventoryWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];

    return inventoryWeapons.filter(
      (w) =>
        (!useAmellwindHomebrew ||
          weaponMatchesLibraryCatalog(w, weaponCatalog)) &&
        w.name.toLowerCase().includes(q) &&
        weaponMatchesLibraryFilters(w, effectiveListFilters),
    );
  }, [
    inventoryWeapons,
    isWeaponSlot,
    q,
    effectiveListFilters,
    useAmellwindHomebrew,
    weaponCatalog,
  ]);

  const catalogWeaponsFiltered = useMemo(() => {
    if (!isWeaponSlot) return [];

    // Only hide catalog rows that already appear in the *same* library catalog
    // (AGMH "Great Sword" must not suppress Forge "Great Sword").
    const invNames = new Set(
      inventoryWeaponsFiltered.map((w) => w.name.toLowerCase()),
    );

    return allWeapons.filter(
      (w) =>
        w.name.toLowerCase().includes(q) &&
        !invNames.has(w.name.toLowerCase()) &&
        weaponMatchesLibraryFilters(w, effectiveListFilters),
    );
  }, [
    allWeapons,
    inventoryWeaponsFiltered,
    isWeaponSlot,
    q,
    effectiveListFilters,
  ]);
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
        onModeChange={(modeIndex) => {
          if (selectedSlot === "mainHand" || selectedSlot === "offHand") {
            setWeaponMode(selectedSlot, modeIndex);
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
