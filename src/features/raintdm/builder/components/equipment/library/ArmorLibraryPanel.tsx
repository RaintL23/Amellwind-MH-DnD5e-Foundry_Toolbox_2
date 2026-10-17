import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BASE_ARMORS } from "@/features/raintdm/builder/data/armor.data";
import {
  armorItemToStandaloneShield,
  isShieldArmorItem,
} from "@/features/raintdm/builder/data/shield.data";
import { SUGGESTED_TRINKETS } from "@/features/raintdm/builder/data/trinket.data";
import { getActiveTrinketSlot } from "@/features/raintdm/builder/utils/trinket.utils";
import { getDndArmors } from "@/features/dnd/items/services/dnd-equipment.service";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/raintdm/builder/context/BuilderInventoryContext";
import type { BuilderSlotSelection } from "@/features/raintdm/builder/hooks/useBuilderSlotSelection";
import { checkArmorProficiency } from "@/features/raintdm/builder/utils/equipment-proficiency.utils";
import { armorMatchesLibraryFilters } from "@/features/raintdm/builder/utils/builder-library-filters";
import {
  buildArmorInventoryBundle,
  buildShieldInventoryBundle,
  buildTrinketInventoryBundle,
} from "@/features/raintdm/builder/utils/equipment-inventory.utils";
import { blocksOffHand } from "@/features/amellwind/weapons/utils/weapon-hands.utils";
import { useSelectedClass } from "@/features/raintdm/builder/hooks/useBuilderSelections";
import { resolveRpgbotContext } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/raintdm/builder/hooks/useRpgbotRatingsLookup";
import type { ListFilterValues } from "@/shared/components/list-filters";
import type { ArmorItem, EquippedArmor } from "@/shared/types";
import { ArmorLibraryDetail } from "./ArmorLibraryDetail";
import { ArmorList, TrinketList } from "./shared/LibraryLists";
import { EmptyState } from "./shared/LibraryUi";

interface ArmorLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
  q: string;
  listFilters?: ListFilterValues;
  onSearchHiddenChange?: (hidden: boolean) => void;
}

export function ArmorLibraryPanel({
  selectedSlot,
  q,
  listFilters = {},
  onSearchHiddenChange,
}: ArmorLibraryPanelProps) {
  const {
    armor,
    trinket1,
    trinket2,
    mainHand,
    equippedShield,
    hasIntegratedShield,
    isOffHandBlocked,
    class: classSelection,
    equipArmor,
    equipShield,
    equipTrinket,
    setActiveTrinket,
    setArmorRarity,
    setArmorRarityProperty,
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

  const rpgbotArmorContext = useMemo(
    () =>
      resolveRpgbotContext({
        className: classSelection?.name,
        guideKey: "class",
        category: "armor",
      }),
    [classSelection?.name],
  );

  const { lookup: rpgbotArmorLookup, ready: rpgbotArmorReady } =
    useRpgbotRatingsLookup(rpgbotArmorContext);

  useEffect(() => {
    if (!isArmorSlot || useAmellwindHomebrew) return;
    setArmorsLoading(true);
    getDndArmors(prefer2024)
      .then(setDndArmors)
      .finally(() => setArmorsLoading(false));
  }, [isArmorSlot, useAmellwindHomebrew, prefer2024]);

  const catalogArmors = useMemo(() => {
    // AGMH: shields only come integrated in a weapon (Sword & Shield, Lance, …).
    if (useAmellwindHomebrew) return BASE_ARMORS;
    return dndArmors;
  }, [useAmellwindHomebrew, dndArmors]);

  const effectiveListFilters = useMemo(
    () => (useAmellwindHomebrew ? { ...listFilters, rarity: "" } : listFilters),
    [useAmellwindHomebrew, listFilters],
  );

  const inventoryArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    return inventoryArmors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) &&
        !(useAmellwindHomebrew && isShieldArmorItem(a)) &&
        armorMatchesLibraryFilters(a, effectiveListFilters),
    );
  }, [inventoryArmors, isArmorSlot, q, effectiveListFilters, useAmellwindHomebrew]);

  const catalogArmorsFiltered = useMemo(() => {
    if (!isArmorSlot) return [];
    const invNames = new Set(inventoryArmors.map((a) => a.name));
    return catalogArmors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) &&
        !invNames.has(a.name) &&
        armorMatchesLibraryFilters(a, effectiveListFilters),
    );
  }, [catalogArmors, inventoryArmors, isArmorSlot, q, effectiveListFilters]);

  const inventoryTrinketsFiltered = useMemo(() => {
    if (!isTrinketSlot) return [];
    return inventoryTrinkets.filter((name) => name.toLowerCase().includes(q));
  }, [inventoryTrinkets, isTrinketSlot, q]);

  const catalogTrinketsFiltered = useMemo(() => {
    if (!isTrinketSlot) return [];
    const invNames = new Set(inventoryTrinkets);
    return SUGGESTED_TRINKETS.filter(
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

  useEffect(() => {
    if (!isArmorSlot) return;
    onSearchHiddenChange?.(false);
  }, [isArmorSlot, onSearchHiddenChange]);

  const getArmorDisabledReason = useCallback(
    (armorItem: ArmorItem): string | null => {
      if (!classSelection) return null;

      if (isShieldArmorItem(armorItem)) {
        if (hasIntegratedShield) {
          return "The off-hand is occupied by the integrated shield";
        }
        if (isOffHandBlocked || blocksOffHand(mainHand)) {
          return "The off-hand is not available";
        }
      }

      const proficiencyCheck = checkArmorProficiency(
        armorItem,
        resolvedArmorItems,
      );
      return proficiencyCheck.allowed
        ? null
        : (proficiencyCheck.reason ?? "Your class is not proficient with this armor.");
    },
    [
      classSelection,
      resolvedArmorItems,
      hasIntegratedShield,
      isOffHandBlocked,
      mainHand,
    ],
  );

  function handleSelectArmor(item: ArmorItem) {
    if (isShieldArmorItem(item)) {
      const shield = armorItemToStandaloneShield(item);
      equipShield(shield);
      addEquipmentBundle(buildShieldInventoryBundle(shield));
      return;
    }

    equipArmor(item);
    addEquipmentBundle(buildArmorInventoryBundle(item));
  }

  function handleSelectTrinket(name: string) {
    if (!isTrinketSlot || !selectedSlot) return;
    equipTrinket(selectedSlot, name);
    addEquipmentBundle(buildTrinketInventoryBundle(name));
  }

  function renderArmorPreview(item: ArmorItem) {
    const previewEquipped: EquippedArmor = {
      armor: item,
      rarity: item.itemRarityLabel ?? item.rarity ?? "Common",
      runeSlots: 0,
      runes: [],
    };
    return <ArmorLibraryDetail equipped={previewEquipped} inline />;
  }

  if (isArmorSlot) {
    if (armorsLoading && !useAmellwindHomebrew) {
      return <EmptyState text="Loading armors..." />;
    }

    return (
      <>
        {showArmorDetail && (
          <ArmorLibraryDetail
            equipped={armor}
            showHomebrewDetails={useAmellwindHomebrew}
            onRarityChange={
              useAmellwindHomebrew ? setArmorRarity : undefined
            }
            onRarityPropertyChange={
              useAmellwindHomebrew ? setArmorRarityProperty : undefined
            }
          />
        )}
        <ArmorList
          showCloth={showClothOption}
          inventory={inventoryArmorsFiltered}
          catalog={catalogArmorsFiltered}
          equippedName={armor?.armor.name ?? null}
          equippedShieldName={equippedShield?.name ?? null}
          onSelect={handleSelectArmor}
          renderDetails={renderArmorPreview}
          getDisabledReason={getArmorDisabledReason}
          rpgbotLookup={rpgbotArmorReady ? rpgbotArmorLookup : null}
        />
      </>
    );
  }

  if (isTrinketSlot) {
    const activeSlot = getActiveTrinketSlot(trinket1, trinket2);
    const isActive = !!equippedTrinket && activeSlot === selectedSlot;
    return (
      <>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Choose a trinket from the PHB trinket table or a trophy from a
          creature you hunted. Each holds one material; only one trinket is
          active at a time (swapping is an action).
        </p>
        {equippedTrinket && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
            <span className="text-[11px] text-foreground">
              {isActive ? "Active trinket" : "Inactive trinket"}
            </span>
            {!isActive && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[11px]"
                onClick={() =>
                  selectedSlot === "trinket1" || selectedSlot === "trinket2"
                    ? setActiveTrinket(selectedSlot)
                    : undefined
                }
              >
                Make active
              </Button>
            )}
          </div>
        )}
        <TrinketList
          inventory={inventoryTrinketsFiltered}
          catalog={catalogTrinketsFiltered}
          equippedName={equippedTrinket?.name ?? null}
          onSelect={handleSelectTrinket}
        />
      </>
    );
  }

  return null;
}
