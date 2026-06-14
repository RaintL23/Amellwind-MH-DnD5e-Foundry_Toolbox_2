import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import {
  loadUseAmellwindHomebrew,
  persistUseAmellwindHomebrew,
} from "../storage/builder-homebrew.storage";
import type { AbilityKey, AbilityScores } from "@/shared/types";
import {
  composeAlignment,
  parseAlignmentAxes,
  type GoodEvilAxis,
  type LawChaosAxis,
} from "../utils/alignment.utils";
import { Character } from "../models/Character";
import { getPrimaryClassLevel } from "../utils/multiclass.utils";
import { useBuilderInventory } from "./BuilderInventoryContext";
import type { CharacterBuilderContextValue } from "./character-builder.types";
import { useIdentitySlice } from "./slices/useIdentitySlice";
import { useProficiencySlice } from "./slices/useProficiencySlice";
import { useSpellSlice } from "./slices/useSpellSlice";
import { useEquipmentSlice } from "./slices/useEquipmentSlice";

export type { CharacterBuilderContextValue } from "./character-builder.types";

const CharacterBuilderContext = createContext<CharacterBuilderContextValue | null>(null);

export function CharacterBuilderProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { clearInventory } = useBuilderInventory();
  const [character, setCharacter] = useState<Character>(() => new Character());
  const [attacksPerTurnOverride, setAttacksPerTurnOverride] = useState<number | null>(null);
  const [useUnarmedStrike, setUseUnarmedStrike] = useState(false);
  const [useAmellwindHomebrew, setUseAmellwindHomebrewState] = useState(
    () => loadUseAmellwindHomebrew(),
  );
  const prevHomebrewRef = useRef(useAmellwindHomebrew);

  const proficiencyResetRef = useRef({
    resetOnSpeciesChange: () => {},
    resetOnBackgroundChange: () => {},
    resetOnClassChange: () => {},
    resetProficiencySlice: () => {},
  });
  const spellResetRef = useRef({
    resetOnClassChange: () => {},
    resetSpellSlice: () => {},
    clearSubclassOptionalFeatures: () => {},
  });

  const onSpeciesChange = useCallback(() => {
    proficiencyResetRef.current.resetOnSpeciesChange();
  }, []);

  const onBackgroundChange = useCallback(() => {
    proficiencyResetRef.current.resetOnBackgroundChange();
  }, []);

  const onClassChange = useCallback(() => {
    proficiencyResetRef.current.resetOnClassChange();
    spellResetRef.current.resetOnClassChange();
  }, []);

  const clearSubclassOptionalFeatures = useCallback(() => {
    spellResetRef.current.clearSubclassOptionalFeatures();
  }, []);

  const identity = useIdentitySlice({
    onSpeciesChange,
    onBackgroundChange,
    onClassChange,
    clearSubclassOptionalFeatures,
  });

  const spell = useSpellSlice({
    classData: identity.classData,
    subclass: identity.subclass,
    characterLevel: character.level,
  });

  const proficiency = useProficiencySlice({
    setCharacter,
    originFeatSkillChoices: identity.originFeatSkillChoices,
    optionalFeatureOriginFeatSlots: spell.optionalFeatureOriginFeatSlots,
    optionalFeatureOriginFeatSkillChoices: spell.optionalFeatureOriginFeatSkillChoices,
  });

  const equipment = useEquipmentSlice({
    character,
    classRef: identity.class,
    speciesRef: identity.species,
    classData: identity.classData,
    speciesData: identity.speciesData,
    attacksPerTurnOverride,
    useUnarmedStrike,
    useAmellwindHomebrew,
  });

  useEffect(() => {
    if (prevHomebrewRef.current && !useAmellwindHomebrew) {
      equipment.clearHomebrewEquipment();
      void identity.clearAmellwindIdentity();
      spell.clearAmellwindOptionalOriginFeats();
    }
    prevHomebrewRef.current = useAmellwindHomebrew;
  }, [
    useAmellwindHomebrew,
    equipment.clearHomebrewEquipment,
    identity.clearAmellwindIdentity,
    spell.clearAmellwindOptionalOriginFeats,
  ]);

  const setUseAmellwindHomebrew = useCallback((value: boolean) => {
    setUseAmellwindHomebrewState(value);
    persistUseAmellwindHomebrew(value);
  }, []);

  proficiencyResetRef.current = {
    resetOnSpeciesChange: proficiency.resetOnSpeciesChange,
    resetOnBackgroundChange: proficiency.resetOnBackgroundChange,
    resetOnClassChange: proficiency.resetOnClassChange,
    resetProficiencySlice: proficiency.resetProficiencySlice,
  };
  spellResetRef.current = {
    resetOnClassChange: spell.resetOnClassChange,
    resetSpellSlice: spell.resetSpellSlice,
    clearSubclassOptionalFeatures: spell.clearSubclassOptionalFeatures,
  };

  const setName = useCallback((name: string) => {
    setCharacter((prev) => prev.withUpdates({ name }));
  }, []);

  const setCreatureSize = useCallback((size: "M" | "S") => {
    setCharacter((prev) => prev.withUpdates({ size }));
  }, []);

  const setLawChaosAlignment = useCallback((lawChaos: LawChaosAxis) => {
    setCharacter((prev) => {
      const { goodEvil } = parseAlignmentAxes(prev.alignment);
      return prev.withUpdates({
        alignment: composeAlignment(lawChaos, goodEvil),
      });
    });
  }, []);

  const setGoodEvilAlignment = useCallback((goodEvil: GoodEvilAxis) => {
    setCharacter((prev) => {
      const { lawChaos } = parseAlignmentAxes(prev.alignment);
      return prev.withUpdates({
        alignment: composeAlignment(lawChaos, goodEvil),
      });
    });
  }, []);

  const syncTotalLevel = useCallback(
    (primaryLevel: number, entries: typeof identity.multiclassEntries) => {
      const additional = entries.reduce((sum, e) => sum + e.level, 0);
      const total = Math.min(20, Math.max(1, primaryLevel + additional));
      setCharacter((prev) => prev.withUpdates({ level: total }));
      identity.trimFeatSelectionsForLevel(total);
      return total;
    },
    [identity.trimFeatSelectionsForLevel],
  );

  const setLevel = useCallback(
    (level: number) => {
      if (identity.multiclassEnabled) {
        const additional = identity.multiclassEntries.reduce(
          (sum, e) => sum + e.level,
          0,
        );
        const primaryLevel = Math.max(1, level - additional);
        syncTotalLevel(primaryLevel, identity.multiclassEntries);
        return;
      }
      setCharacter((prev) => prev.withUpdates({ level }));
      identity.trimFeatSelectionsForLevel(level);
    },
    [
      identity.multiclassEnabled,
      identity.multiclassEntries,
      identity.trimFeatSelectionsForLevel,
      syncTotalLevel,
    ],
  );

  const setPrimaryClassLevel = useCallback(
    (primaryLevel: number) => {
      syncTotalLevel(primaryLevel, identity.multiclassEntries);
    },
    [identity.multiclassEntries, syncTotalLevel],
  );

  const setMulticlassEntryLevel = useCallback(
    (index: number, level: number) => {
      const clamped = Math.max(0, Math.min(19, level));
      const entries = identity.multiclassEntries.map((entry, i) =>
        i === index ? { ...entry, level: clamped } : entry,
      );
      identity.setMulticlassEntryLevel(index, clamped);
      const primaryLevel = getPrimaryClassLevel(
        character.level,
        identity.multiclassEntries,
      );
      const newTotal = Math.min(
        20,
        primaryLevel + entries.reduce((sum, e) => sum + e.level, 0),
      );
      setCharacter((prev) => prev.withUpdates({ level: newTotal }));
      identity.trimFeatSelectionsForLevel(newTotal);
    },
    [
      character.level,
      identity.multiclassEntries,
      identity.setMulticlassEntryLevel,
      identity.trimFeatSelectionsForLevel,
    ],
  );

  const setMulticlassEnabled = useCallback(
    (enabled: boolean) => {
      identity.setMulticlassEnabled(enabled);
      if (enabled && identity.multiclassEntries.length === 0) {
        identity.addMulticlassEntry();
      }
    },
    [
      identity.setMulticlassEnabled,
      identity.multiclassEntries.length,
      identity.addMulticlassEntry,
    ],
  );

  const primaryClassLevel = identity.multiclassEnabled
    ? getPrimaryClassLevel(character.level, identity.multiclassEntries)
    : character.level;

  const setAbilityScore = useCallback((ability: AbilityKey, value: number) => {
    const clamped = Math.max(1, Math.min(30, value));
    setCharacter((prev) =>
      prev.withUpdates({ abilities: { [ability]: clamped } as Partial<AbilityScores> }),
    );
  }, []);

  const setAbilityScores = useCallback((abilities: Partial<AbilityScores>) => {
    const clamped = Object.fromEntries(
      Object.entries(abilities).map(([key, value]) => [
        key,
        Math.max(1, Math.min(30, value as number)),
      ]),
    ) as Partial<AbilityScores>;
    setCharacter((prev) =>
      prev.withUpdates({ abilities: { ...prev.abilities, ...clamped } }),
    );
  }, []);

  const resetBuild = useCallback(() => {
    setCharacter(new Character());
    setAttacksPerTurnOverride(null);
    setUseUnarmedStrike(false);
    identity.resetIdentitySlice();
    proficiency.resetProficiencySlice();
    spell.resetSpellSlice();
    equipment.resetEquipment();
    clearInventory();
  }, [
    clearInventory,
    identity.resetIdentitySlice,
    proficiency.resetProficiencySlice,
    spell.resetSpellSlice,
    equipment.resetEquipment,
  ]);

  const contextValue = useMemo<CharacterBuilderContextValue>(
    () => ({
      character,
      setName,
      setCreatureSize,
      setLawChaosAlignment,
      setGoodEvilAlignment,
      setLevel,
      setAbilityScore,
      setAbilityScores,
      attacksPerTurnOverride,
      setAttacksPerTurnOverride,
      effectiveAttacksPerTurn: equipment.effectiveAttacksPerTurn,
      useUnarmedStrike,
      setUseUnarmedStrike,
      useAmellwindHomebrew,
      setUseAmellwindHomebrew,
      mainHand: equipment.mainHand,
      offHand: equipment.offHand,
      armor: equipment.armor,
      trinket1: equipment.trinket1,
      trinket2: equipment.trinket2,
      species: identity.species,
      background: identity.background,
      class: identity.class,
      subclass: identity.subclass,
      featSelections: identity.featSelections,
      speciesOriginFeatGrant: identity.speciesOriginFeatGrant,
      speciesOriginFeat: identity.speciesOriginFeat,
      backgroundOriginFeatGrant: identity.backgroundOriginFeatGrant,
      backgroundOriginFeat: identity.backgroundOriginFeat,
      originFeatSkillChoices: identity.originFeatSkillChoices,
      optionalFeatureOriginFeatSlots: spell.optionalFeatureOriginFeatSlots,
      optionalFeatureOriginFeats: spell.optionalFeatureOriginFeats,
      optionalFeatureOriginFeatSkillChoices: spell.optionalFeatureOriginFeatSkillChoices,
      backstoryNotes: identity.backstoryNotes,
      personality: identity.personality,
      faction: identity.faction,
      setSpecies: identity.setSpecies,
      setBackground: identity.setBackground,
      setClass: identity.setClass,
      setSubclass: identity.setSubclass,
      setFeatAtIndex: identity.setFeatAtIndex,
      multiclassEnabled: identity.multiclassEnabled,
      multiclassEntries: identity.multiclassEntries,
      multiclassClassData: identity.multiclassClassData,
      primaryClassLevel,
      setMulticlassEnabled,
      addMulticlassEntry: identity.addMulticlassEntry,
      removeMulticlassEntry: identity.removeMulticlassEntry,
      setMulticlassEntryClass: identity.setMulticlassEntryClass,
      setMulticlassEntryLevel,
      setMulticlassEntrySubclass: identity.setMulticlassEntrySubclass,
      setPrimaryClassLevel,
      setSpeciesOriginFeat: identity.setSpeciesOriginFeat,
      setOptionalFeatureOriginFeatAtIndex: spell.setOptionalFeatureOriginFeatAtIndex,
      classData: identity.classData,
      classDataLoading: identity.classDataLoading,
      speciesData: identity.speciesData,
      speciesDataLoading: identity.speciesDataLoading,
      useTashaOrigin: identity.useTashaOrigin,
      setUseTashaOrigin: identity.setUseTashaOrigin,
      tashaPlus2: identity.tashaPlus2,
      tashaPlus1: identity.tashaPlus1,
      setTashaPlus2: identity.setTashaPlus2,
      setTashaPlus1: identity.setTashaPlus1,
      speciesAbilityChoices: identity.speciesAbilityChoices,
      setSpeciesAbilityChoice: identity.setSpeciesAbilityChoice,
      backgroundAsiMode: identity.backgroundAsiMode,
      setBackgroundAsiMode: identity.setBackgroundAsiMode,
      backgroundAsiPlus2: identity.backgroundAsiPlus2,
      backgroundAsiPlus1: identity.backgroundAsiPlus1,
      setBackgroundAsiPlus2: identity.setBackgroundAsiPlus2,
      setBackgroundAsiPlus1: identity.setBackgroundAsiPlus1,
      setBackstoryNotes: identity.setBackstoryNotes,
      setPersonality: identity.setPersonality,
      setPersonalityField: identity.setPersonalityField,
      setFaction: identity.setFaction,
      isTwoHanded: equipment.isTwoHanded,
      isOffHandBlocked: equipment.isOffHandBlocked,
      offHandBlockReason: equipment.offHandBlockReason,
      hasIntegratedShield: equipment.hasIntegratedShield,
      integratedShieldAcBonus: equipment.integratedShieldAcBonus,
      equippedShield: equipment.equippedShield,
      standaloneShieldAcBonus: equipment.standaloneShieldAcBonus,
      shieldAcBonus: equipment.shieldAcBonus,
      equipWeapon: equipment.equipWeapon,
      unequipWeapon: equipment.unequipWeapon,
      setWeaponRarity: equipment.setWeaponRarity,
      setVersatileMode: equipment.setVersatileMode,
      equipArmor: equipment.equipArmor,
      unequipArmor: equipment.unequipArmor,
      equipShield: equipment.equipShield,
      unequipShield: equipment.unequipShield,
      setArmorRarity: equipment.setArmorRarity,
      equipTrinket: equipment.equipTrinket,
      unequipTrinket: equipment.unequipTrinket,
      clearEquipment: equipment.clearEquipment,
      assignWeaponRune: equipment.assignWeaponRune,
      removeWeaponRune: equipment.removeWeaponRune,
      assignArmorRune: equipment.assignArmorRune,
      removeArmorRune: equipment.removeArmorRune,
      assignTrinketRune: equipment.assignTrinketRune,
      removeTrinketRune: equipment.removeTrinketRune,
      totalAC: equipment.totalAC,
      combat: equipment.combat,
      spellSelections: spell.spellSelections,
      addSpell: spell.addSpell,
      removeSpell: spell.removeSpell,
      clearSpells: spell.clearSpells,
      optionalFeatureSelections: spell.optionalFeatureSelections,
      setOptionalFeaturesForProgression: spell.setOptionalFeaturesForProgression,
      clearOptionalFeatureProgression: spell.clearOptionalFeatureProgression,
      resetBuild,
      applyIdentityGrants: proficiency.applyIdentityGrants,
      allSkillGrants: proficiency.allSkillGrants,
      allExpertiseGrants: proficiency.allExpertiseGrants,
      allSkillAdvantages: proficiency.allSkillAdvantages,
      saveProficiencyAbilities: proficiency.saveProficiencyAbilities,
      classSkillChoices: proficiency.classSkillChoices,
      backgroundSkillChoices: proficiency.backgroundSkillChoices,
      speciesSkillChoices: proficiency.speciesSkillChoices,
      featSkillChoices: proficiency.featSkillChoices,
      expertiseChoices: proficiency.expertiseChoices,
      setClassSkillChoicesAtIndex: proficiency.setClassSkillChoicesAtIndex,
      setBackgroundSkillChoices: proficiency.setBackgroundSkillChoices,
      setSpeciesSkillChoices: proficiency.setSpeciesSkillChoices,
      setFeatSkillChoices: proficiency.setFeatSkillChoices,
      setOriginFeatSkillChoices: identity.setOriginFeatSkillChoices,
      setOptionalFeatureOriginFeatSkillChoicesAtIndex:
        spell.setOptionalFeatureOriginFeatSkillChoicesAtIndex,
      setExpertiseChoices: proficiency.setExpertiseChoices,
      skillSources: proficiency.skillSources,
      expertiseSources: proficiency.expertiseSources,
      allToolGrants: proficiency.allToolGrants,
      allLanguageGrants: proficiency.allLanguageGrants,
      allDefenseGrants: proficiency.allDefenseGrants,
      classToolChoices: proficiency.classToolChoices,
      backgroundToolChoices: proficiency.backgroundToolChoices,
      speciesToolChoices: proficiency.speciesToolChoices,
      classLanguageChoices: proficiency.classLanguageChoices,
      backgroundLanguageChoices: proficiency.backgroundLanguageChoices,
      speciesLanguageChoices: proficiency.speciesLanguageChoices,
      speciesDefenseChoices: proficiency.speciesDefenseChoices,
      setClassToolChoicesAtIndex: proficiency.setClassToolChoicesAtIndex,
      setBackgroundToolChoices: proficiency.setBackgroundToolChoices,
      setSpeciesToolChoices: proficiency.setSpeciesToolChoices,
      setClassLanguageChoicesAtIndex: proficiency.setClassLanguageChoicesAtIndex,
      setBackgroundLanguageChoices: proficiency.setBackgroundLanguageChoices,
      setSpeciesLanguageChoices: proficiency.setSpeciesLanguageChoices,
      setSpeciesDefenseChoicesAtIndex: proficiency.setSpeciesDefenseChoicesAtIndex,
      toolSources: proficiency.toolSources,
      languageSources: proficiency.languageSources,
      defenseSources: proficiency.defenseSources,
      resolvedToolItems: proficiency.resolvedToolItems,
      resolvedArmorItems: proficiency.resolvedArmorItems,
      resolvedWeaponItems: proficiency.resolvedWeaponItems,
      armorSources: proficiency.armorSources,
      weaponSources: proficiency.weaponSources,
      resolvedLanguageItems: proficiency.resolvedLanguageItems,
      resolvedResistances: proficiency.resolvedResistances,
      resolvedImmunities: proficiency.resolvedImmunities,
    }),
    [
      character,
      setName,
      setCreatureSize,
      setLawChaosAlignment,
      setGoodEvilAlignment,
      setLevel,
      setAbilityScore,
      setAbilityScores,
      attacksPerTurnOverride,
      useUnarmedStrike,
      useAmellwindHomebrew,
      setUseAmellwindHomebrew,
      resetBuild,
      identity,
      spell,
      proficiency,
      equipment,
    ],
  );

  return (
    <CharacterBuilderContext.Provider value={contextValue}>
      {children}
    </CharacterBuilderContext.Provider>
  );
}

export function useCharacterBuilder(): CharacterBuilderContextValue {
  const ctx = useContext(CharacterBuilderContext);
  if (!ctx)
    throw new Error("useCharacterBuilder must be used inside CharacterBuilderProvider");
  return ctx;
}
