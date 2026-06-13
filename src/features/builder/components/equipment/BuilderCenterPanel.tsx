import { Sparkles, Sword, Users } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import {
  useBuilderSlotSelection,
  type BuilderSlotSelection,
  isSpellPickerSlot,
} from "../../hooks/useBuilderSlotSelection";
import { useSelectedClass } from "../../hooks/useSelectedClass";
import {
  isFeatSlotSelection,
  isOptionalOriginFeatSlot,
  isSubclassLevelReached,
  parseFeatSlotIndex,
  parseOptionalOriginFeatSlotIndex,
} from "../../utils/builder-class.utils";
import {
  getProgressionPicks,
  isOptionalFeatureSlot,
  parseOptionalFeatureSlot,
  resolveOptionalFeatureProgressions,
} from "../../utils/class-optional-features.utils";
import { useEffect, useMemo } from "react";
import { RuneAssignmentPanel } from "./RuneAssignmentPanel";
import { WeaponDetailPanel } from "./WeaponDetailPanel";
import { ArmorDetailPanel } from "./ArmorDetailPanel";
import { IdentityGridPanel } from "./IdentityGridPanel";
import { EquipmentGridPanel } from "./EquipmentGridPanel";
import { SpellcastingGridPanel } from "./SpellcastingGridPanel";
import { SpellLibraryPanel } from "./SpellLibraryPanel";
import { OptionalFeatureLibraryPanel } from "./OptionalFeatureLibraryPanel";
import { BuilderLibraryPanel } from "./library/BuilderLibraryPanel";
import { BackstoryNotesPanel } from "./BackstoryNotesPanel";
import { FactionLibraryPanel } from "./library/FactionLibraryPanel";
import { BuilderPanel } from "../shared/BuilderPanel";
import { isOffHandSlotOccupied } from "@/features/weapons/utils/weapon-hands.utils";
import { useSpellcasting } from "../../hooks/useSpellcasting";
import { useSelectedSubclass } from "../../hooks/useSelectedSubclass";
import { useOptionalFeatureSpellGrants } from "../../hooks/useOptionalFeatureSpellGrants";
import { useSpellCatalog } from "../../hooks/useSpellCatalog";

export function BuilderCenterPanel() {
  const {
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
    character,
    species,
    background,
    class: classSelection,
    subclass,
    featSelections,
    speciesOriginFeatGrant,
    speciesOriginFeat,
    backgroundOriginFeatGrant,
    backgroundOriginFeat,
    backstoryNotes,
    faction,
    setFaction,
    isOffHandBlocked,
    offHandBlockReason,
    hasIntegratedShield,
    integratedShieldAcBonus,
    equippedShield,
    standaloneShieldAcBonus,
    setWeaponRarity,
    setArmorRarity,
    setVersatileMode,
    setSpecies,
    setBackground,
    setClass,
    setSubclass,
    setFeatAtIndex,
    setSpeciesOriginFeat,
    setOptionalFeatureOriginFeatAtIndex,
    optionalFeatureOriginFeatSlots,
    optionalFeatureOriginFeats,
    unequipWeapon,
    unequipArmor,
    unequipShield,
    unequipTrinket,
    spellSelections,
    addSpell,
    removeSpell,
    optionalFeatureSelections,
    setOptionalFeaturesForProgression,
    clearOptionalFeatureProgression,
    useAmellwindHomebrew,
  } = useCharacterBuilder();

  const { selectedSlot, selectSlot, clearSelection } =
    useBuilderSlotSelection();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const {
    allSpells,
    loading: spellsLoading,
    spellLevelByName,
  } = useSpellCatalog();
  const optionalFeatureSpellGrants = useOptionalFeatureSpellGrants(
    optionalFeatureSelections ?? {},
    character.level,
  );
  const spellcastingInfo = useSpellcasting(
    classData,
    subclassData,
    character.level,
    character.abilities,
    spellSelections ?? {},
    optionalFeatureSelections ?? {},
    optionalFeatureSpellGrants,
    faction,
  );

  const optionalProgressions = useMemo(
    () =>
      resolveOptionalFeatureProgressions(
        classData,
        subclassData,
        character.level,
      ),
    [classData, subclassData, character.level],
  );

  useEffect(() => {
    // Wait until class data loads — clearing while classData is null would
    // wipe a valid subclass when returning from another route.
    if (!classData) return;
    if (!isSubclassLevelReached(classData, character.level) && subclass) {
      setSubclass(null);
    }
  }, [classData, character.level, subclass, setSubclass]);

  const selectedWeapon =
    selectedSlot === "mainHand"
      ? mainHand
      : selectedSlot === "offHand"
        ? offHand
        : null;

  const offHandOccupied = isOffHandSlotOccupied(
    offHand,
    equippedShield,
    hasIntegratedShield,
  );

  const weaponGripContext =
    selectedSlot === "mainHand" || selectedSlot === "offHand"
      ? {
          weaponSlot: selectedSlot,
          offHandOccupied,
          mainHandOccupied: !!mainHand,
        }
      : null;

  const showRunePanel =
    useAmellwindHomebrew &&
    selectedSlot &&
    selectedSlot !== "species" &&
    selectedSlot !== "background" &&
    selectedSlot !== "faction" &&
    selectedSlot !== "backstory" &&
    selectedSlot !== "class" &&
    selectedSlot !== "subclass" &&
    selectedSlot !== "origin-feat" &&
    !isOptionalOriginFeatSlot(selectedSlot) &&
    !isFeatSlotSelection(selectedSlot) &&
    !isOptionalFeatureSlot(selectedSlot) &&
    !isSpellPickerSlot(selectedSlot) &&
    !(selectedSlot === "offHand" && (hasIntegratedShield || equippedShield));

  function isSlotOccupied(slot: BuilderSlotSelection): boolean {
    if (!slot) return false;
    switch (slot) {
      case "mainHand":
        return !!mainHand;
      case "offHand":
        return isOffHandSlotOccupied(
          offHand,
          equippedShield,
          hasIntegratedShield,
        );
      case "armor":
        return !!armor;
      case "trinket1":
        return !!trinket1;
      case "trinket2":
        return !!trinket2;
      case "species":
        return !!species;
      case "background":
        return !!background;
      case "faction":
        return !!faction;
      case "class":
        return !!classSelection;
      case "subclass":
        return !!subclass;
      case "origin-feat":
        return (
          !!speciesOriginFeat ||
          !!backgroundOriginFeat ||
          speciesOriginFeatGrant?.kind === "fixed" ||
          backgroundOriginFeatGrant?.kind === "fixed"
        );
      default:
        if (isOptionalOriginFeatSlot(slot)) {
          const index = parseOptionalOriginFeatSlotIndex(slot);
          return !!optionalFeatureOriginFeats[index];
        }
        if (isFeatSlotSelection(slot)) {
          const index = parseFeatSlotIndex(slot);
          return !!featSelections[index];
        }
        if (isOptionalFeatureSlot(slot)) {
          const parsed = parseOptionalFeatureSlot(slot);
          if (!parsed) return false;
          return (
            getProgressionPicks(optionalFeatureSelections, parsed.progressionId)
              .length > 0
          );
        }
        return false;
    }
  }

  function handleUnequipSlot(slot: BuilderSlotSelection) {
    if (!slot) return;
    switch (slot) {
      case "mainHand":
        unequipWeapon("mainHand");
        break;
      case "offHand":
        if (hasIntegratedShield) return;
        if (equippedShield) unequipShield();
        else unequipWeapon("offHand");
        break;
      case "armor":
        unequipArmor();
        break;
      case "trinket1":
      case "trinket2":
        unequipTrinket(slot);
        break;
      case "species":
        setSpecies(null);
        break;
      case "background":
        setBackground(null);
        break;
      case "faction":
        setFaction(null);
        break;
      case "class":
        setClass(null);
        break;
      case "subclass":
        setSubclass(null);
        break;
      case "origin-feat":
        if (speciesOriginFeatGrant?.kind === "choose") {
          setSpeciesOriginFeat(null);
        }
        break;
      default:
        if (isOptionalOriginFeatSlot(slot)) {
          setOptionalFeatureOriginFeatAtIndex(
            parseOptionalOriginFeatSlotIndex(slot),
            null,
          );
        } else if (isFeatSlotSelection(slot)) {
          setFeatAtIndex(parseFeatSlotIndex(slot), null);
        } else if (isOptionalFeatureSlot(slot)) {
          const parsed = parseOptionalFeatureSlot(slot);
          if (parsed) clearOptionalFeatureProgression(parsed.progressionId);
        }
        break;
    }
    selectSlot(slot);
  }

  const showBackstoryPanel = selectedSlot === "backstory";
  const showFactionPanel = selectedSlot === "faction";
  const showSpellLibrary =
    selectedSlot !== null && isSpellPickerSlot(selectedSlot);
  const showOptionalFeatureLibrary =
    selectedSlot !== null && isOptionalFeatureSlot(selectedSlot);

  const showLibrary =
    selectedSlot &&
    selectedSlot !== "backstory" &&
    selectedSlot !== "faction" &&
    !isSpellPickerSlot(selectedSlot) &&
    !isOptionalFeatureSlot(selectedSlot) &&
    (!isSlotOccupied(selectedSlot) ||
      selectedSlot === "species" ||
      selectedSlot === "background" ||
      selectedSlot === "class" ||
      selectedSlot === "subclass" ||
      selectedSlot === "origin-feat" ||
      isOptionalOriginFeatSlot(selectedSlot) ||
      isFeatSlotSelection(selectedSlot) ||
      selectedSlot === "mainHand" ||
      selectedSlot === "offHand" ||
      selectedSlot === "armor");

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <BuilderPanel
        title={
          <>
            <Users className="h-3.5 w-3.5" aria-hidden />
            Character Stuff
          </>
        }
        action={
          <span className="text-[11px] text-muted-foreground">
            click to change
          </span>
        }
      >
        <IdentityGridPanel
          species={species}
          background={background}
          classSelection={classSelection}
          subclass={subclass}
          classData={classData}
          subclassData={subclassData}
          level={character.level}
          featSelections={featSelections}
          optionalFeatureSelections={optionalFeatureSelections}
          speciesOriginFeatGrant={speciesOriginFeatGrant}
          speciesOriginFeat={speciesOriginFeat}
          backgroundOriginFeatGrant={backgroundOriginFeatGrant}
          backgroundOriginFeat={backgroundOriginFeat}
          optionalFeatureOriginFeatSlots={optionalFeatureOriginFeatSlots}
          optionalFeatureOriginFeats={optionalFeatureOriginFeats}
          backstoryNotes={backstoryNotes}
          faction={faction}
          showFaction={useAmellwindHomebrew}
          selectedSlot={selectedSlot}
          onSelectSlot={selectSlot}
          onUnequipSlot={handleUnequipSlot}
        />
      </BuilderPanel>

      <BuilderPanel
        title={
          <>
            <Sword className="h-3.5 w-3.5" aria-hidden />
            Equipment
          </>
        }
        action={
          <span className="text-[11px] text-muted-foreground">
            click to change
          </span>
        }
      >
        <EquipmentGridPanel
          showTrinkets={useAmellwindHomebrew}
          useAmellwindHomebrew={useAmellwindHomebrew}
          mainHand={mainHand}
          offHand={offHand}
          armor={armor}
          trinket1={trinket1}
          trinket2={trinket2}
          hasIntegratedShield={hasIntegratedShield}
          integratedShieldAcBonus={integratedShieldAcBonus}
          equippedShield={equippedShield}
          standaloneShieldAcBonus={standaloneShieldAcBonus}
          isOffHandBlocked={isOffHandBlocked}
          offHandBlockReason={offHandBlockReason}
          selectedSlot={selectedSlot}
          onSelectSlot={selectSlot}
          onUnequipSlot={handleUnequipSlot}
        />
      </BuilderPanel>

      {spellcastingInfo.isSpellcaster && classSelection && (
        <BuilderPanel
          title={
            <>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {spellcastingInfo.sectionLabel}: {classSelection.name}
            </>
          }
          action={
            spellcastingInfo.maxPreparedOrKnown > 0 ? (
              <span className="flex items-center gap-2 text-[11px]">
                <span
                  className={
                    spellcastingInfo.selectedSpellCount >=
                    spellcastingInfo.maxPreparedOrKnown
                      ? "text-rose-400"
                      : "text-emerald-400"
                  }
                >
                  {spellcastingInfo.isPreparedCaster
                    ? "Prepared"
                    : spellcastingInfo.usesUnifiedPactPool
                      ? "Pact known"
                      : "Known"}{" "}
                  {spellcastingInfo.selectedSpellCount}/
                  {spellcastingInfo.maxPreparedOrKnown}
                  {spellcastingInfo.usesUnifiedPactPool &&
                    spellcastingInfo.pactSlotCount > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {spellcastingInfo.pactSlotCount} slot
                        {spellcastingInfo.pactSlotCount !== 1
                          ? "s"
                          : ""} (niv. {spellcastingInfo.pactMaxSpellLevel})
                      </span>
                    )}
                </span>
                {spellcastingInfo.subclassAlwaysPrepared.length > 0 && (
                  <span className="text-emerald-400/80">
                    + {spellcastingInfo.subclassAlwaysPrepared.length} always
                    prepared
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                click to select
              </span>
            )
          }
        >
          <SpellcastingGridPanel
            className={classSelection.name}
            spellcastingInfo={spellcastingInfo}
            spellSelections={spellSelections}
            spellLevelByName={spellLevelByName}
            spellsByName={allSpells}
            selectedSlot={selectedSlot}
            onSelectSlot={selectSlot}
          />
        </BuilderPanel>
      )}

      {selectedWeapon &&
        useAmellwindHomebrew &&
        (selectedSlot === "mainHand" || selectedSlot === "offHand") && (
          <WeaponDetailPanel
            equipped={selectedWeapon}
            gripContext={weaponGripContext!}
            showHomebrewDetails={useAmellwindHomebrew}
            onRarityChange={(r) => setWeaponRarity(selectedSlot, r)}
            onVersatileChange={(twoHanded) =>
              setVersatileMode(selectedSlot, twoHanded)
            }
          />
        )}

      {selectedSlot === "armor" && armor && (
        <ArmorDetailPanel
          armor={armor}
          showHomebrewDetails={useAmellwindHomebrew}
          onRarityChange={setArmorRarity}
        />
      )}

      {showRunePanel && selectedSlot && (
        <RuneAssignmentPanel slot={selectedSlot} onClose={clearSelection} />
      )}

      {showBackstoryPanel && <BackstoryNotesPanel />}

      {useAmellwindHomebrew && showFactionPanel && <FactionLibraryPanel />}

      {showSpellLibrary && selectedSlot && classSelection && (
        <SpellLibraryPanel
          selectedSlot={selectedSlot}
          className={classSelection.name}
          characterLevel={character.level}
          spellcastingInfo={spellcastingInfo}
          spellSelections={spellSelections}
          allSpells={allSpells}
          spellsLoading={spellsLoading}
          spellLevelByName={spellLevelByName}
          onAddSpell={addSpell}
          onRemoveSpell={removeSpell}
        />
      )}

      {showOptionalFeatureLibrary &&
        isOptionalFeatureSlot(selectedSlot) &&
        classData && (
          <OptionalFeatureLibraryPanel
            selectedSlot={selectedSlot}
            progressions={optionalProgressions}
            classData={classData}
            subclass={subclassData}
            level={character.level}
            selections={optionalFeatureSelections}
            onSetSelections={setOptionalFeaturesForProgression}
          />
        )}

      {showLibrary && <BuilderLibraryPanel selectedSlot={selectedSlot} />}
    </div>
  );
}
