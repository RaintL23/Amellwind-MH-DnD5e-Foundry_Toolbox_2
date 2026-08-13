import { useEffect, useMemo, useState } from "react";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/raintdm/builder/hooks/useBuilderSelections";
import {
  isOriginFeatSlot,
  isFeatSlotSelection,
  isOptionalOriginFeatSlot,
  parseFeatSlotIndex,
  parseOptionalOriginFeatSlotIndex,
} from "@/features/raintdm/builder/utils/builder-class.utils";
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import { isOffHandWeaponPickerAvailable } from "@/features/amellwind/weapons/utils/weapon-hands.utils";
import type { BuilderSlotSelection } from "@/features/raintdm/builder/hooks/useBuilderSlotSelection";
import {
  isMulticlassClassSlot,
  isMulticlassSubclassSlot,
  parseMulticlassClassSlotIndex,
  parseMulticlassSubclassSlotIndex,
} from "@/features/raintdm/builder/utils/multiclass.utils";
import { BuilderPanel } from "../../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../../shared/ScrollableWhenNeeded";
import {
  ListSearchWithFilters,
  buildDefaultFilterValues,
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
import { useLibrarySearch } from "./hooks/useLibrarySearch";
import { toRpgbotClassSlug } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { RpgbotLegend } from "../../shared/RpgbotLegend";
import { RpgbotLoadingHint } from "../../shared/RpgbotLoadingHint";
import { useRpgbotRatingsContext } from "@/features/raintdm/builder/context/RpgbotRatingsContext";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import {
  ARMOR_LIBRARY_FILTER_SECTIONS,
  EQUIPMENT_RARITY_LIBRARY_FILTER_SECTION,
  FEAT_LIBRARY_FILTER_SECTIONS,
  WEAPON_LIBRARY_FILTER_SECTIONS,
  buildFeatCatalogFilterSection,
  buildIdentityCatalogFilterSection,
  buildLibrarySourceFilterSections,
  buildWeaponCatalogFilterSection,
  parseFeatDataSource,
  parseIdentityDataSource,
  parseWeaponLibraryCatalog,
  type FeatDataSource,
  type IdentityDataSource,
} from "@/features/raintdm/builder/utils/builder-library-filters";
import { getClassFilterSourceCodes } from "@/features/dnd/classes/services/class.service";

interface BuilderLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
}

export function BuilderLibraryPanel({ selectedSlot }: BuilderLibraryPanelProps) {
  const { search, setSearch, q } = useLibrarySearch(selectedSlot);
  const [showAsiPanel, setShowAsiPanel] = useState(false);
  const [featSearchHidden, setFeatSearchHidden] = useState(false);
  const [filterValues, setFilterValues] = useState<ListFilterValues>({});
  const [filterResetKey, setFilterResetKey] = useState("");

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

  const isClassOrSubclassSlot =
    selectedSlot === "class" ||
    selectedSlot === "subclass" ||
    (selectedSlot !== null && isMulticlassClassSlot(selectedSlot)) ||
    (selectedSlot !== null && isMulticlassSubclassSlot(selectedSlot));

  const [classFilterSourceCodes, setClassFilterSourceCodes] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (!isClassOrSubclassSlot) return;
    let cancelled = false;
    void getClassFilterSourceCodes().then((codes) => {
      if (!cancelled) setClassFilterSourceCodes(codes);
    });
    return () => {
      cancelled = true;
    };
  }, [isClassOrSubclassSlot]);

  const rpgbotClassSlug = classSelection?.name
    ? toRpgbotClassSlug(classSelection.name)
    : null;

  const defaultIdentityCatalog = useMemo((): IdentityDataSource => {
    if (!useAmellwindHomebrew) return "dnd";
    const isIdentitySlot =
      selectedSlot === "species" || selectedSlot === "background";
    if (isIdentitySlot && rpgbotClassSlug) return "dnd";
    return "amellwind";
  }, [useAmellwindHomebrew, selectedSlot, rpgbotClassSlug]);

  const defaultFeatCatalog = useMemo((): FeatDataSource => {
    if (!useAmellwindHomebrew || isAnyOriginFeatSlotSelected) return "dnd2024";
    return "amellwind";
  }, [useAmellwindHomebrew, isAnyOriginFeatSlotSelected]);

  const filterSections = useMemo((): ListFilterSectionConfig[] => {
    if (isWeaponSlot) {
      return useAmellwindHomebrew
        ? [
            buildWeaponCatalogFilterSection("forge"),
            ...WEAPON_LIBRARY_FILTER_SECTIONS,
          ]
        : [
            EQUIPMENT_RARITY_LIBRARY_FILTER_SECTION,
            ...WEAPON_LIBRARY_FILTER_SECTIONS,
          ];
    }
    if (isArmorSlot) {
      return useAmellwindHomebrew
        ? ARMOR_LIBRARY_FILTER_SECTIONS
        : [
            EQUIPMENT_RARITY_LIBRARY_FILTER_SECTION,
            ...ARMOR_LIBRARY_FILTER_SECTIONS,
          ];
    }
    if (isFeatPicker) {
      if (isAnyOriginFeatSlotSelected) return FEAT_LIBRARY_FILTER_SECTIONS;
      return [
        buildFeatCatalogFilterSection({
          includeAmellwind: useAmellwindHomebrew,
          defaultValue: defaultFeatCatalog,
        }),
        ...FEAT_LIBRARY_FILTER_SECTIONS,
      ];
    }
    if (isIdentityOrClassSlot) {
      const sourceCodes = isClassOrSubclassSlot
        ? classFilterSourceCodes
        : catalog.keys();
      const sourceSections = buildLibrarySourceFilterSections(
        sourceCodes,
        catalog,
        bookNames,
      );
      if (useAmellwindHomebrew && (isSpeciesSlot || isBackgroundSlot)) {
        return [
          buildIdentityCatalogFilterSection(defaultIdentityCatalog),
          ...sourceSections,
        ];
      }
      return sourceSections;
    }
    return [];
  }, [
    isWeaponSlot,
    isArmorSlot,
    isFeatPicker,
    isAnyOriginFeatSlotSelected,
    isIdentityOrClassSlot,
    isClassOrSubclassSlot,
    isSpeciesSlot,
    isBackgroundSlot,
    useAmellwindHomebrew,
    defaultFeatCatalog,
    defaultIdentityCatalog,
    classFilterSourceCodes,
    catalog,
    bookNames,
  ]);

  // Include catalog size so defaults re-apply once Sources finish loading.
  // Without this, the first reset stores {} while catalog is still empty and
  // the Filters dialog never shows the official-source selection.
  const sourceSectionDefaultsKey = useMemo(() => {
    const src = filterSections.find((section) => section.id === "src");
    if (!src?.defaultValues?.length) return "0";
    return `${src.defaultValues.length}:${src.options.length}`;
  }, [filterSections]);

  const nextFilterResetKey = [
    selectedSlot ?? "",
    useAmellwindHomebrew ? "1" : "0",
    classSelection?.name ?? "",
    defaultFeatCatalog,
    defaultIdentityCatalog,
    isWeaponSlot ? "w" : "",
    isArmorSlot ? "a" : "",
    isFeatPicker ? "f" : "",
    isAnyOriginFeatSlotSelected ? "o" : "",
    isIdentityOrClassSlot ? `src:${sourceSectionDefaultsKey}` : "",
  ].join("|");

  if (nextFilterResetKey !== filterResetKey) {
    setFilterResetKey(nextFilterResetKey);
    setFilterValues(buildDefaultFilterValues(filterSections));
  }

  useEffect(() => {
    setShowAsiPanel(false);
    setFeatSearchHidden(false);
  }, [selectedSlot, classSelection?.name]);

  const featSource = useMemo(
    () => parseFeatDataSource(filterValues.catalog, defaultFeatCatalog),
    [filterValues.catalog, defaultFeatCatalog],
  );

  const identitySource = useMemo(
    () =>
      parseIdentityDataSource(filterValues.catalog, defaultIdentityCatalog),
    [filterValues.catalog, defaultIdentityCatalog],
  );

  const weaponLibraryCatalog = useMemo(
    () => parseWeaponLibraryCatalog(filterValues.catalog, "forge"),
    [filterValues.catalog],
  );

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

  const panelTitle = selectedSlot
    ? showAsiPanel
      ? "ASI"
      : `Library — ${slotLabel}`
    : "Library";

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
              listFilters={filterValues}
              weaponCatalog={weaponLibraryCatalog}
            />
            <ArmorLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              listFilters={filterValues}
            />
            <IdentityLibraryPanel
              selectedSlot={selectedSlot}
              q={q}
              identitySource={identitySource}
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
