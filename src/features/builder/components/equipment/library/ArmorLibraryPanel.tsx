import { useCallback, useMemo } from "react";
import { BASE_ARMORS } from "@/features/builder/data/armor.data";
import { PLACEHOLDER_TRINKETS } from "@/features/builder/data/trinket.data";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import { checkArmorProficiency } from "@/features/builder/utils/equipment-proficiency.utils";
import {
  buildArmorInventoryBundle,
  buildTrinketInventoryBundle,
} from "@/features/builder/utils/equipment-inventory.utils";
import type { ArmorItem } from "@/shared/types";
import { ArmorLibraryDetail } from "./ArmorLibraryDetail";
import { ArmorList, TrinketList } from "./shared/LibraryLists";

interface ArmorLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
  q: string;
}

export function ArmorLibraryPanel({ selectedSlot, q }: ArmorLibraryPanelProps) {
  const {
    armor,
    trinket1,
    trinket2,
    class: classSelection,
    equipArmor,
    equipTrinket,
    resolvedArmorItems,
    useAmellwindHomebrew,
  } = useCharacterBuilder();

  const {
    armors: inventoryArmors,
    trinkets: inventoryTrinkets,
    addEquipmentBundle,
  } = useBuilderInventory();

  const isArmorSlot = selectedSlot === "armor";
  const isTrinketSlot =
    useAmellwindHomebrew &&
    (selectedSlot === "trinket1" || selectedSlot === "trinket2");

  const inventoryArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    return inventoryArmors.filter((a) => a.name.toLowerCase().includes(q));
  }, [inventoryArmors, isArmorSlot, q]);

  const catalogArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    const invNames = new Set(inventoryArmors.map((a) => a.name));
    return BASE_ARMORS.filter(
      (a) => a.name.toLowerCase().includes(q) && !invNames.has(a.name),
    );
  }, [inventoryArmors, isArmorSlot, q]);

  const inventoryTrinketsFiltered = useMemo(() => {
    if (!isTrinketSlot) return [];
    return inventoryTrinkets.filter((name) => name.toLowerCase().includes(q));
  }, [inventoryTrinkets, isTrinketSlot, q]);

  const catalogTrinketsFiltered = useMemo(() => {
    if (!isTrinketSlot) return [];
    const invNames = new Set(inventoryTrinkets);
    return PLACEHOLDER_TRINKETS.filter(
      (name) => name.toLowerCase().includes(q) && !invNames.has(name),
    );
  }, [inventoryTrinkets, isTrinketSlot, q]);

  const showClothOption = useMemo(() => {
    if (!isArmorSlot) return false;
    if (!q) return true;
    return [
      "cloth",
      "clothing",
      "robe",
      "tunic",
      "caster",
      "mage",
      "wizard",
      "monk",
    ].some((term) => term.includes(q) || q.includes(term));
  }, [isArmorSlot, q]);

  const equippedTrinket =
    selectedSlot === "trinket1"
      ? trinket1
      : selectedSlot === "trinket2"
        ? trinket2
        : null;

  const showArmorDetail = isArmorSlot && !!armor;

  const getArmorDisabledReason = useCallback(
    (armorItem: ArmorItem): string | null => {
      if (!classSelection) return null;

      const proficiencyCheck = checkArmorProficiency(
        armorItem,
        resolvedArmorItems,
      );
      return proficiencyCheck.allowed
        ? null
        : (proficiencyCheck.reason ?? "Your class is not proficient with this armor.");
    },
    [classSelection, resolvedArmorItems],
  );

  function handleSelectArmor(item: ArmorItem) {
    equipArmor(item);
    addEquipmentBundle(buildArmorInventoryBundle(item));
  }

  function handleSelectTrinket(name: string) {
    if (!isTrinketSlot || !selectedSlot) return;
    equipTrinket(selectedSlot, name);
    addEquipmentBundle(buildTrinketInventoryBundle(name));
  }

  if (isArmorSlot) {
    if (showArmorDetail) {
      return <ArmorLibraryDetail equipped={armor} />;
    }

    return (
      <ArmorList
        showCloth={showClothOption}
        inventory={inventoryArmorsFiltered}
        catalog={catalogArmorsFiltered}
        equippedName={armor?.armor.name ?? null}
        onSelect={handleSelectArmor}
        getDisabledReason={getArmorDisabledReason}
      />
    );
  }

  if (isTrinketSlot) {
    return (
      <TrinketList
        inventory={inventoryTrinketsFiltered}
        catalog={catalogTrinketsFiltered}
        equippedName={equippedTrinket?.name ?? null}
        onSelect={handleSelectTrinket}
      />
    );
  }

  return null;
}
