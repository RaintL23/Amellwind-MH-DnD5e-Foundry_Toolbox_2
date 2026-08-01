import { useEffect, useMemo, useState } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/builder/hooks/useBuilderSelections";
import {
  isOriginFeatSlot,
  isFeatSlotSelection,
  isOptionalOriginFeatSlot,
  parseFeatSlotIndex,
  parseOptionalOriginFeatSlotIndex,
} from "@/features/builder/utils/builder-class.utils";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { isOffHandWeaponPickerAvailable } from "@/features/weapons/utils/weapon-hands.utils";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import {
  isMulticlassClassSlot,
  isMulticlassSubclassSlot,
  parseMulticlassClassSlotIndex,
  parseMulticlassSubclassSlotIndex,
} from "@/features/builder/utils/multiclass.utils";
import { BuilderPanel } from "../../shared/BuilderPanel";
import {
  IdentitySourceBadgeGroup,
  type IdentityDataSource,
} from "../../shared/IdentitySourceBadgeGroup";
import {
  FeatSourceBadgeGroup,
  type FeatDataSource,
} from "../../shared/FeatSourceBadgeGroup";
import { ScrollableWhenNeeded } from "../../shared/ScrollableWhenNeeded";
import {
  ListSearchWithFilters,
  type ListFilterSectionConfig,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import { ArmorLibraryPanel } from "./ArmorLibraryPanel";
import { WeaponLibraryPanel } from "./WeaponLibraryPanel";
import {
  ClassLibraryPanel,
  isClassDetailVisible,
  isSubclassDetailVisible,
} from "./ClassLibraryPanel";
import {
  IdentityLibraryPanel,
  isIdentityDetailVisible,
} from "./IdentityLibraryPanel";
import { FeatLibraryPanel, isFeatPickerSlot } from "./FeatLibraryPanel";
import { SLOT_LABELS } from "./constants";
import { EmptyState } from "./shared/LibraryUi";
import { EquipmentRarityFilterGroup } from "../../shared/EquipmentRarityFilterGroup";
import type { EquipmentRarityFilter } from "@/features/builder/utils/dnd-rarity.utils";
import { useLibrarySearch } from "./hooks/useLibrarySearch";
import { toRpgbotClassSlug } from "@/features/builder/data/rpgbot-ratings.utils";
import { RpgbotLegend } from "../../shared/RpgbotLegend";
import { RpgbotLoadingHint } from "../../shared/RpgbotLoadingHint";
import { useRpgbotRatingsContext } from "@/features/builder/context/RpgbotRatingsContext";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import {
  ARMOR_LIBRARY_FILTER_SECTIONS,
  FEAT_LIBRARY_FILTER_SECTIONS,
  WEAPON_LIBRARY_FILTER_SECTIONS,
  buildLibrarySourceFilterSections,
} from "@/features/builder/utils/builder-library-filters";

interface BuilderLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
}

export function BuilderLibraryPanel({ selectedSlot }: BuilderLibraryPanelProps) {
  const { search, setSearch, q } = useLibrarySearch(selectedSlot);
  const [identitySourceOverride, setIdentitySourceOverride] =
    useState<IdentityDataSource | null>(null);
  const [featSource, setFeatSource] = useState<FeatDataSource>("amellwind");
  const [showAsiPanel, setShowAsiPanel] = useState(false);
  const [featSearchHidden, setFeatSearchHidden] = useState(false);
  const [equipmentRarity, setEquipmentRarity] =
    useState<EquipmentRarityFilter>("Standard");
  const [filterValues, setFilterValues] = useState<ListFilterValues>({});

  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const {
    mainHand,
    offHand,
    equippedShield,
    hasIntegratedShield,
    isOffHandBlocked,
    species,
    background,
    class: classSelection,
    subclass,
    optionalFeatureOriginFeatSlots,
    useAmellwindHomebrew,
  } = useCharacterBuilder();

  const { classData } = useSelectedClass();
  const { ready: rpgbotReady } = useRpgbotRatingsContext();

  const isSpeciesSlot = selectedSlot === "species";
  const isBackgroundSlot = selectedSlot === "background";
  const isWeaponSlot =
    selectedSlot === "mainHand" || selectedSlot === "offHand";
  const isArmorSlot = selectedSlot === "armor";
  const isFeatSlot = selectedSlot !== null && isFeatSlotSelection(selectedSlot);
  const isInvocationOriginFeatSlotSelected =
    selectedSlot !== null && isOptionalOriginFeatSlot(selectedSlot);
  const invocationOriginFeatIndex = isInvocationOriginFeatSlotSelected
    ? parseOptionalOriginFeatSlotIndex(selectedSlot)
    : null;
  const featSlotIndex = isFeatSlot ? parseFeatSlotIndex(selectedSlot) : null;
  const isFeatPicker = isFeatPickerSlot(selectedSlot);
  const isOriginFeatSlotSelected =
    selectedSlot !== null && isOriginFeatSlot(selectedSlot);
  const isAnyOriginFeatSlotSelected =
    isOriginFeatSlotSelected || isInvocationOriginFeatSlotSelected;
  const isIdentityOrClassSlot =
    isSpeciesSlot ||
    isBackgroundSlot ||
    selectedSlot === "class" ||
    selectedSlot === "subclass" ||
    (selectedSlot !== null && isMulticlassClassSlot(selectedSlot)) ||
    (selectedSlot !== null && isMulticlassSubclassSlot(selectedSlot));

  const rpgbotClassSlug = classSelection?.name
    ? toRpgbotClassSlug(classSelection.name)
    : null;

  useEffect(() => {
    setIdentitySourceOverride(null);
  }, [selectedSlot, classSelection?.name]);

  const identitySource = useMemo((): IdentityDataSource => {
    if (!useAmellwindHomebrew) return "dnd";
    if (identitySourceOverride) return identitySourceOverride;
    const isIdentitySlot =
      selectedSlot === "species" || selectedSlot === "background";
    if (isIdentitySlot && rpgbotClassSlug) return "dnd";
    return "amellwind";
  }, [
    useAmellwindHomebrew,
    identitySourceOverride,
    selectedSlot,
    rpgbotClassSlug,
  ]);

  useEffect(() => {
    setShowAsiPanel(false);
    setFeatSearchHidden(false);
    setEquipmentRarity("Standard");
    setFilterValues({});

    if (!useAmellwindHomebrew) {
      setFeatSource("dnd2024");
      return;
    }
    setFeatSource("amellwind");
  }, [selectedSlot, useAmellwindHomebrew, classSelection?.name]);

  useEffect(() => {
    if (!useAmellwindHomebrew) {
      setFeatSource("dnd2024");
    }
  }, [useAmellwindHomebrew]);

  useEffect(() => {
    if (!isFeatPicker) return;
    if (isInvocationOriginFeatSlotSelected || isOriginFeatSlotSelected) {
      setFeatSource("dnd2024");
    }
  }, [
    isFeatPicker,
    isInvocationOriginFeatSlotSelected,
    isOriginFeatSlotSelected,
  ]);

  const activeSubclass = useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find(
        (sc) => sc.id === subclass.id,
      ) ?? null
    );
  }, [classData, subclass]);

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

  const hideSearch =
    isIdentityDetailVisible(selectedSlot, species, background) ||
    isClassDetailVisible(selectedSlot, classSelection, classData) ||
    isSubclassDetailVisible(selectedSlot, subclass, activeSubclass) ||
    showWeaponDetail ||
    featSearchHidden;

  const showIdentitySourceToggle =
    useAmellwindHomebrew && (isSpeciesSlot || isBackgroundSlot);
  const showFeatSourceToggle =
    isFeatSlot && !showAsiPanel && !isAnyOriginFeatSlotSelected;
  const showEquipmentRarityToggle =
    !useAmellwindHomebrew &&
    (isWeaponSlot || isArmorSlot) &&
    !showWeaponDetail;

  const showRpgbotLegend =
    !!rpgbotClassSlug &&
    !hideSearch &&
    selectedSlot !== null &&
    selectedSlot !== "class" &&
    !isMulticlassClassSlot(selectedSlot);

  const filterSections = useMemo((): ListFilterSectionConfig[] => {
    if (isWeaponSlot) return WEAPON_LIBRARY_FILTER_SECTIONS;
    if (isArmorSlot) return ARMOR_LIBRARY_FILTER_SECTIONS;
    if (isFeatPicker) return FEAT_LIBRARY_FILTER_SECTIONS;
    if (isIdentityOrClassSlot) {
      return buildLibrarySourceFilterSections(
        catalog.keys(),
        catalog,
        bookNames,
      );
    }
    return [];
  }, [
    isWeaponSlot,
    isArmorSlot,
    isFeatPicker,
    isIdentityOrClassSlot,
    catalog,
    bookNames,
  ]);

  const slotLabel = useMemo(() => {
    if (!selectedSlot) return "Library";
    if (isInvocationOriginFeatSlotSelected && invocationOriginFeatIndex !== null) {
      const slotMeta = optionalFeatureOriginFeatSlots[invocationOriginFeatIndex];
      return slotMeta
        ? `Origin Feat · ${slotMeta.sourceFeatureName}`
        : "Origin Feat";
    }
    if (isFeatSlotSelection(selectedSlot)) {
      return `Feat ${featSlotIndex !== null ? featSlotIndex + 1 : ""}`.trim();
    }
    if (!useAmellwindHomebrew && selectedSlot === "mainHand") return "Main Hand";
    if (!useAmellwindHomebrew && selectedSlot === "offHand") return "Off Hand";
    if (isMulticlassClassSlot(selectedSlot)) {
      return `Class ${parseMulticlassClassSlotIndex(selectedSlot) + 2}`;
    }
    if (isMulticlassSubclassSlot(selectedSlot)) {
      return `Subclass ${parseMulticlassSubclassSlotIndex(selectedSlot) + 2}`;
    }
    return SLOT_LABELS[selectedSlot] ?? selectedSlot;
  }, [
    selectedSlot,
    featSlotIndex,
    isInvocationOriginFeatSlotSelected,
    invocationOriginFeatIndex,
    optionalFeatureOriginFeatSlots,
    useAmellwindHomebrew,
  ]);

  const panelTitle = selectedSlot ? (
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <span>{showAsiPanel ? "ASI" : `Library — ${slotLabel}`}</span>
      {showIdentitySourceToggle && (
        <IdentitySourceBadgeGroup
          value={identitySource}
          onChange={setIdentitySourceOverride}
        />
      )}
      {showFeatSourceToggle && (
        <FeatSourceBadgeGroup
          value={featSource}
          onChange={setFeatSource}
          hideAmellwind={!useAmellwindHomebrew}
        />
      )}
      {showEquipmentRarityToggle && (
        <EquipmentRarityFilterGroup
          value={equipmentRarity}
          onChange={setEquipmentRarity}
        />
      )}
    </span>
  ) : (
    "Library"
  );

  const dialogTitle = isWeaponSlot
    ? "Weapon Filters"
    : isArmorSlot
      ? "Armor Filters"
      : isFeatPicker
        ? "Feat Filters"
        : "Library Filters";

  return (
    <BuilderPanel title={panelTitle}>
      {!selectedSlot ? (
        <EmptyState text="Click on an equipment slot to see the available options." />
      ) : (
        <>
          {!hideSearch && (
            <div className="mb-2">
              <ListSearchWithFilters
                compact
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search..."
                sections={filterSections}
                filterValues={filterValues}
                onFiltersApply={setFilterValues}
                dialogTitle={dialogTitle}
                dialogDescription="Narrow the library list. Changes apply when you save."
              />
            </div>
          )}

          <ScrollableWhenNeeded>
            {showRpgbotLegend && (
              <>
                {!rpgbotReady && <RpgbotLoadingHint />}
                <RpgbotLegend />
              </>
            )}
            <WeaponLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              rarityFilter={equipmentRarity}
              listFilters={filterValues}
            />
            <ArmorLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              rarityFilter={equipmentRarity}
              listFilters={filterValues}
            />
            <IdentityLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              identitySource={identitySource}
              onIdentitySourceChange={setIdentitySourceOverride}
              listFilters={filterValues}
            />
            <ClassLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              listFilters={filterValues}
            />
            <FeatLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              featSource={featSource}
              onFeatSourceChange={setFeatSource}
              onShowAsiPanelChange={setShowAsiPanel}
              onSearchHiddenChange={setFeatSearchHidden}
              listFilters={filterValues}
            />
          </ScrollableWhenNeeded>
        </>
      )}
    </BuilderPanel>
  );
}
