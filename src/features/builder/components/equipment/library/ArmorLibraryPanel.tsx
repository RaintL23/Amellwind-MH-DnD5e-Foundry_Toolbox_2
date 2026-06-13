import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE_ARMORS } from "@/features/builder/data/armor.data";
import { PLACEHOLDER_TRINKETS } from "@/features/builder/data/trinket.data";
import { getDndBuilderArmors } from "@/features/builder/services/dnd-armor.service";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/builder/context/BuilderInventoryContext";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import { checkArmorProficiency } from "@/features/builder/utils/equipment-proficiency.utils";
import { matchesEquipmentRarityFilter } from "@/features/builder/utils/dnd-rarity.utils";
import type { EquipmentRarityFilter } from "@/features/builder/utils/dnd-rarity.utils";
import {
  buildArmorInventoryBundle,
  buildTrinketInventoryBundle,
} from "@/features/builder/utils/equipment-inventory.utils";
import { useSelectedClass } from "@/features/builder/hooks/useSelectedClass";
import type { ArmorItem } from "@/shared/types";
import { ArmorLibraryDetail } from "./ArmorLibraryDetail";
import { ArmorList, TrinketList } from "./shared/LibraryLists";
import { EmptyState } from "./shared/LibraryUi";

interface ArmorLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
  q: string;
  rarityFilter?: EquipmentRarityFilter;
}

function getArmorRarityLabel(armor: ArmorItem): string {
  return armor.itemRarityLabel ?? armor.rarity ?? "Standard";
}

export function ArmorLibraryPanel({
  selectedSlot,
  q,
  rarityFilter = "Standard",
}: ArmorLibraryPanelProps) {
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

  const { classData } = useSelectedClass();
  const [dndArmors, setDndArmors] = useState<ArmorItem[]>([]);
  const [armorsLoading, setArmorsLoading] = useState(false);

  const {
    armors: inventoryArmors,
    trinkets: inventoryTrinkets,
    addEquipmentBundle,
  } = useBuilderInventory();

  const isArmorSlot = selectedSlot === "armor";
  const isTrinketSlot =
    useAmellwindHomebrew &&
    (selectedSlot === "trinket1" || selectedSlot === "trinket2");

  const prefer2024 = classData?.source === "XPHB";

  useEffect(() => {
    if (!isArmorSlot || useAmellwindHomebrew) return;
    setArmorsLoading(true);
    getDndBuilderArmors(prefer2024)
      .then(setDndArmors)
      .finally(() => setArmorsLoading(false));
  }, [isArmorSlot, useAmellwindHomebrew, prefer2024]);

  const catalogArmors = useAmellwindHomebrew ? BASE_ARMORS : dndArmors;

  const matchesRarity = useCallback(
    (armorItem: ArmorItem) => {
      if (useAmellwindHomebrew) return true;
      return matchesEquipmentRarityFilter(
        getArmorRarityLabel(armorItem),
        rarityFilter,
      );
    },
    [rarityFilter, useAmellwindHomebrew],
  );

  const inventoryArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    return inventoryArmors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) &&
        matchesRarity(a),
    );
  }, [inventoryArmors, isArmorSlot, q, matchesRarity]);

  const catalogArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    const invNames = new Set(inventoryArmors.map((a) => a.name));
    return catalogArmors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) &&
        !invNames.has(a.name) &&
        matchesRarity(a),
    );
  }, [catalogArmors, inventoryArmors, isArmorSlot, q, matchesRarity]);

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
    if (!isArmorSlot || !useAmellwindHomebrew) return false;
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
  }, [isArmorSlot, q, useAmellwindHomebrew]);

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

    if (armorsLoading && !useAmellwindHomebrew) {
      return <EmptyState text="Loading armors..." />;
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
