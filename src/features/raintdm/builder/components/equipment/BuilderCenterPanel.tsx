/**
 * Builder center column: identity / equipment / spell grids + contextual detail panels.
 *
 * Flow: read CharacterBuilder + selectedSlot → compute which library/detail to show →
 * render grids always, then one contextual panel (weapon/armor/runes/library/etc.).
 * Slot click → selectSlot; unequip → handleUnequipSlot then re-select so library reopens.
 */
import { Sparkles, Sword, Users, X } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import {
  useBuilderSlotSelection,
  type BuilderSlotSelection,
  isSpellPickerSlot,
} from "../../hooks/useBuilderSlotSelection";
import { useSelectedClass, useSelectedSubclass } from "../../hooks/useBuilderSelections";
import {
  isFeatSlotSelection,
  isOptionalOriginFeatSlot,
  isSubclassLevelReached,
  parseFeatSlotIndex,
  parseOptionalOriginFeatSlotIndex,
} from "../../utils/builder-class.utils";
import {
  isMulticlassClassSlot,
  isMulticlassSubclassSlot,
  parseMulticlassClassSlotIndex,
  parseMulticlassSubclassSlotIndex,
} from "../../utils/multiclass.utils";
import {
  getProgressionPicks,
  isOptionalFeatureSlot,
  parseOptionalFeatureSlot,
  resolveOptionalFeatureProgressions,
} from "../../utils/class-optional-features.utils";
import { resolveEffectiveOriginFeatChooseTarget } from "../../utils/origin-feat.constants";
import { useEffect, useMemo, useRef } from "react";
import { RuneAssignmentPanel } from "./RuneAssignmentPanel";
import { IdentityGridPanel } from "./IdentityGridPanel";
import { EquipmentGridPanel } from "./EquipmentGridPanel";
import { SpellcastingGridPanel } from "./SpellcastingGridPanel";
import { useSpeciesSpellGrantUi } from "./SpeciesInnateSpellsPanel";
import { SpellLibraryPanel } from "./SpellLibraryPanel";
import { OptionalFeatureLibraryPanel } from "./OptionalFeatureLibraryPanel";
import { BuilderLibraryPanel } from "./library/BuilderLibraryPanel";
import { BackstoryNotesPanel } from "./BackstoryNotesPanel";
import { FactionLibraryPanel } from "./library/FactionLibraryPanel";
import { BuilderPanel } from "../shared/BuilderPanel";
import { Button } from "@/components/ui/button";
import { isOffHandSlotOccupied } from "@/features/amellwind/weapons/utils/weapon-hands.utils";
import { useSpellcastingContext } from "../../context/SpellcastingContext";
import { useSpellCatalog } from "../../hooks/useSpellCatalog";
import {
  buildSpellcastingSectionTitle,
  computeSpellcastingAttackStats,
  hasChoosableSpellList,
  isSpellSlotChoosable,
  resolveSpellcastingSourceName,
  spellSlotHasLockedGrants,
  spellSlotNeedsSpellListChoice,
} from "../../utils/spellcasting-stats.utils";
import { isSpeciesLineageSpell } from "../../utils/species-spell-grants.utils";
import { useEffectiveAbilityScores } from "../../hooks/useEffectiveAbilityScores";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { formatBuilderSlotLabel } from "../../utils/builder-slot-label.utils";

export function BuilderCenterPanel() {
  // ─── Builder + slot selection state ───
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
    setSpecies,
    setBackground,
    setClass,
    setSubclass,
    setFeatAtIndex,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    setMulticlassEntryClass,
    setMulticlassEntrySubclass,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
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
    resolvedWeaponItems,
  } = useCharacterBuilder();
  const effectiveScores = useEffectiveAbilityScores();

  const { selectedSlot, selectSlot, clearSelection } =
    useBuilderSlotSelection();
  const contextualPanelRef = useRef<HTMLDivElement>(null);
  const contextualHeadingRef = useRef<HTMLHeadingElement>(null);
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const {
    allSpells,
    loading: spellsLoading,
    spellLevelByName,
  } = useSpellCatalog();
  const { centerPanelSpellcasting: spellcastingInfo } = useSpellcastingContext();
  const speciesSpellGrants = useSpeciesSpellGrantUi();
  const hasSpeciesSpellsInSelections = useMemo(
    () =>
      Object.values(spellSelections ?? {}).some((list) =>
        list.some((spell) => isSpeciesLineageSpell(spell)),
      ),
    [spellSelections],
  );
  const spellAttackStats = useMemo(
    () =>
      computeSpellcastingAttackStats(
        spellcastingInfo.spellcastingAbility,
        character.getProficiencyBonus(),
        (key) => getAbilityModifier(effectiveScores[key]),
      ),
    [
      spellcastingInfo.spellcastingAbility,
      character.level,
      effectiveScores,
    ],
  );
  const choosableSpellList = hasChoosableSpellList(spellcastingInfo);
  const showSpellcastingSection =
    choosableSpellList ||
    hasSpeciesSpellsInSelections ||
    spellcastingInfo.subclassAlwaysPrepared.length > 0 ||
    spellcastingInfo.subclassBonusKnown.length > 0 ||
    spellcastingInfo.optionalFeatureGranted.length > 0;
  const spellcastingSourceName = resolveSpellcastingSourceName({
    spellcastingInfo,
    className: classSelection?.name,
    speciesGrantLabel: speciesSpellGrants.groupLabel,
  });
  const spellcastingTitle = buildSpellcastingSectionTitle({
    sectionLabel: spellcastingInfo.sectionLabel,
    sourceName: spellcastingSourceName,
    spellAttackBonus: spellAttackStats.spellAttackBonus,
    spellSaveDc: spellAttackStats.spellSaveDc,
  });
  const showSpellGrid =
    spellcastingInfo.isSpellcaster ||
    spellcastingInfo.bonusCantripPools.length > 0 ||
    hasSpeciesSpellsInSelections;

  // ─── Derived: optional feature progressions + subclass level guard ───
  const optionalProgressions = useMemo(
    () =>
      resolveOptionalFeatureProgressions(
        classData,
        subclassData,
        primaryClassLevel,
      ),
    [classData, subclassData, primaryClassLevel],
  );

  // Drop subclass if level no longer qualifies (e.g. after level-down).
  useEffect(() => {
    if (!classData) return;
    if (!isSubclassLevelReached(classData, primaryClassLevel) && subclass) {
      setSubclass(null);
    }
  }, [classData, primaryClassLevel, subclass, setSubclass]);

  // Runes only for Amellwind gear slots (not identity / spells / shields).
  const showRunePanel =
    useAmellwindHomebrew &&
    selectedSlot &&
    selectedSlot !== "species" &&
    selectedSlot !== "background" &&
    selectedSlot !== "faction" &&
    selectedSlot !== "backstory" &&
    selectedSlot !== "class" &&
    selectedSlot !== "subclass" &&
    !isMulticlassClassSlot(selectedSlot) &&
    !isMulticlassSubclassSlot(selectedSlot) &&
    selectedSlot !== "origin-feat" &&
    !isOptionalOriginFeatSlot(selectedSlot) &&
    !isFeatSlotSelection(selectedSlot) &&
    !isOptionalFeatureSlot(selectedSlot) &&
    !isSpellPickerSlot(selectedSlot) &&
    !(selectedSlot === "offHand" && (hasIntegratedShield || equippedShield));

  // ─── Slot occupancy (library vs detail routing) ───
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
        return isOriginFeatOccupied();
      default:
        if (isMulticlassClassSlot(slot)) {
          const index = parseMulticlassClassSlotIndex(slot);
          return !!multiclassEntries[index]?.classRef;
        }
        if (isMulticlassSubclassSlot(slot)) {
          const index = parseMulticlassSubclassSlotIndex(slot);
          return !!multiclassEntries[index]?.subclass;
        }
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

  function isOriginFeatOccupied(): boolean {
    return (
      !!speciesOriginFeat ||
      !!backgroundOriginFeat ||
      speciesOriginFeatGrant?.kind === "fixed" ||
      backgroundOriginFeatGrant?.kind === "fixed"
    );
  }

  // Clear slot contents, then re-select so the picker/library opens again.
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
      case "origin-feat": {
        const chooseTarget = resolveEffectiveOriginFeatChooseTarget(
          speciesOriginFeatGrant,
          backgroundOriginFeatGrant,
          {
            preferBackgroundChoose: useAmellwindHomebrew,
            hasBackground: background !== null,
          },
        );
        if (chooseTarget === "species") {
          setSpeciesOriginFeat(null);
        } else if (chooseTarget === "background") {
          setBackgroundOriginFeat(null);
        }
        break;
      }
      default:
        if (isMulticlassClassSlot(slot)) {
          setMulticlassEntryClass(parseMulticlassClassSlotIndex(slot), null);
        } else if (isMulticlassSubclassSlot(slot)) {
          setMulticlassEntrySubclass(
            parseMulticlassSubclassSlotIndex(slot),
            null,
          );
        } else if (isOptionalOriginFeatSlot(slot)) {
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

  // ─── Which contextual panel to show under the grids ───
  const showBackstoryPanel = selectedSlot === "backstory";
  const showFactionPanel = selectedSlot === "faction";
  const allowSpellPicks =
    selectedSlot !== null &&
    isSpellPickerSlot(selectedSlot) &&
    isSpellSlotChoosable(selectedSlot, spellcastingInfo);
  const showSpellLibrary =
    selectedSlot !== null &&
    isSpellPickerSlot(selectedSlot) &&
    (allowSpellPicks ||
      spellSlotNeedsSpellListChoice(selectedSlot, spellcastingInfo) ||
      spellSlotHasLockedGrants(
        selectedSlot,
        spellcastingInfo,
        spellSelections,
        spellLevelByName,
        allSpells,
      ));
  const showOptionalFeatureLibrary =
    selectedSlot !== null && isOptionalFeatureSlot(selectedSlot);

  // Generic catalog library: empty slots, or identity/gear slots that stay pickable when filled.
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
      isMulticlassClassSlot(selectedSlot) ||
      isMulticlassSubclassSlot(selectedSlot) ||
      selectedSlot === "origin-feat" ||
      isOptionalOriginFeatSlot(selectedSlot) ||
      isFeatSlotSelection(selectedSlot) ||
      selectedSlot === "mainHand" ||
      selectedSlot === "offHand" ||
      selectedSlot === "armor");

  const showContextualPanel =
    showBackstoryPanel ||
    showFactionPanel ||
    showSpellLibrary ||
    showOptionalFeatureLibrary ||
    showLibrary ||
    showRunePanel;

  // Auto-scroll + focus the contextual panel when the selected slot changes.
  useEffect(() => {
    if (!selectedSlot || !showContextualPanel) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const panel = contextualPanelRef.current;
    if (panel) {
      panel.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    }
    requestAnimationFrame(() => {
      contextualHeadingRef.current?.focus();
    });
  }, [selectedSlot, showContextualPanel]);

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {/* ─── Always-visible grids ─── */}
      <BuilderPanel
        sectionId="identity"
        title={
          <>
            <Users className="h-3.5 w-3.5" aria-hidden />
            Identity &amp; Class
          </>
        }
        action={
          <span className="text-[11px] text-muted-foreground">
            Select a slot to edit
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
          primaryClassLevel={primaryClassLevel}
          multiclassEnabled={multiclassEnabled}
          multiclassEntries={multiclassEntries}
          multiclassClassData={multiclassClassData}
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
        sectionId="equipment"
        title={
          <>
            <Sword className="h-3.5 w-3.5" aria-hidden />
            Equipment
          </>
        }
        action={
          <span className="text-[11px] text-muted-foreground">
            Select a slot to edit
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

      {showSpellcastingSection && (
        <BuilderPanel
          sectionId="spells"
          title={
            <>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {spellcastingTitle}
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
                  {spellcastingInfo.selectedSpellCount >=
                  spellcastingInfo.maxPreparedOrKnown
                    ? " (full)"
                    : " (available)"}
                  {spellcastingInfo.usesUnifiedPactPool &&
                    spellcastingInfo.pactSlotCount > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {spellcastingInfo.pactSlotCount} slot
                        {spellcastingInfo.pactSlotCount !== 1
                          ? "s"
                          : ""}{" "}
                        (lvl {spellcastingInfo.pactMaxSpellLevel})
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
                Select a slot to edit
              </span>
            )
          }
        >
          {showSpellGrid && (
            <SpellcastingGridPanel
              className={
                classSelection?.name ??
                speciesSpellGrants.groupLabel ??
                "Species"
              }
              spellcastingInfo={spellcastingInfo}
              spellSelections={spellSelections}
              spellLevelByName={spellLevelByName}
              spellsByName={allSpells}
              selectedSlot={selectedSlot}
              onSelectSlot={selectSlot}
            />
          )}
        </BuilderPanel>
      )}

      {/* ─── Contextual panels (mutually driven by selectedSlot) ─── */}
      {showContextualPanel && selectedSlot && (
        <div
          ref={contextualPanelRef}
          className="scroll-mt-14 space-y-2.5 rounded-lg border border-border/60 bg-card/80 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              ref={contextualHeadingRef}
              tabIndex={-1}
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground outline-none"
            >
              Editing: {formatBuilderSlotLabel(selectedSlot)}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={clearSelection}
              aria-label="Close editor"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Close
            </Button>
          </div>

          {showRunePanel && (
            <RuneAssignmentPanel slot={selectedSlot} onClose={clearSelection} />
          )}

          {showBackstoryPanel && <BackstoryNotesPanel />}

          {useAmellwindHomebrew && showFactionPanel && <FactionLibraryPanel />}

          {showSpellLibrary && (
            <SpellLibraryPanel
              selectedSlot={selectedSlot}
              className={
                classSelection?.name ??
                speciesSpellGrants.groupLabel ??
                "Character"
              }
              speciesName={species?.name}
              characterLevel={character.level}
              spellcastingInfo={spellcastingInfo}
              spellSelections={spellSelections}
              allSpells={allSpells}
              spellsLoading={spellsLoading}
              spellLevelByName={spellLevelByName}
              allowSpellPicks={allowSpellPicks}
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
                weaponProficiencies={resolvedWeaponItems}
              />
            )}

          {showLibrary && <BuilderLibraryPanel selectedSlot={selectedSlot} />}
        </div>
      )}
    </div>
  );
}
