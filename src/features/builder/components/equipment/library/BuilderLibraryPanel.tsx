import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/builder/hooks/useSelectedClass";
import {
  isOriginFeatSlot,
  isFeatSlotSelection,
  isOptionalOriginFeatSlot,
  parseFeatSlotIndex,
  parseOptionalOriginFeatSlotIndex,
} from "@/features/builder/utils/builder-class.utils";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import {
  isOffHandWeaponPickerAvailable,
} from "@/features/weapons/utils/weapon-hands.utils";
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

  return (
    <BuilderPanel title={panelTitle}>
      {!selectedSlot ? (
        <EmptyState text="Click on an equipment slot to see the available options." />
      ) : (
        <>
          {!hideSearch && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
            />
            <ArmorLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              rarityFilter={equipmentRarity}
            />
            <IdentityLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              identitySource={identitySource}
              onIdentitySourceChange={setIdentitySourceOverride}
            />
            <ClassLibraryPanel selectedSlot={selectedSlot} q={q} />
            <FeatLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              featSource={featSource}
              onFeatSourceChange={setFeatSource}
              onShowAsiPanelChange={setShowAsiPanel}
              onSearchHiddenChange={setFeatSearchHidden}
            />
          </ScrollableWhenNeeded>
        </>
      )}
    </BuilderPanel>
  );
}
