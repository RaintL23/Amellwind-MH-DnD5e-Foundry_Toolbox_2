import { useCallback, useState } from "react";
import { useRpgbotRatingsContext } from "@/features/raintdm/builder/context/RpgbotRatingsContext";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/raintdm/builder/context/BuilderInventoryContext";
import { randomizeCharacterPipeline } from "@/features/raintdm/builder/utils/randomizer/randomize-character.pipeline";
import type {
  RandomizeCharacterContext,
  RandomizerCatalogs,
  RandomizerSetters,
} from "@/features/raintdm/builder/utils/randomizer/randomize-context.types";

export function useCharacterRandomizer() {
  const [isRandomizing, setIsRandomizing] = useState(false);
  const { data: rpgbotData, createLookup } = useRpgbotRatingsContext();
  const { addEquipmentBundle } = useBuilderInventory();

  const builder = useCharacterBuilder();
  const {
    character,
    useAmellwindHomebrew,
    class: classRef,
    classLocked,
    resetBuild,
    setLevel,
    setName,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setClass,
    setClassLocked,
    setSubclass,
    setSpecies,
    setBackground,
    setAbilityScores,
    setAbilityScoreMethod,
    setClassSkillChoicesAtIndex,
    setBackgroundSkillChoices,
    setSpeciesSkillChoices,
    setSpeciesAbilityChoice,
    setBackgroundAsiMode,
    setBackgroundAsiPlus2,
    setBackgroundAsiPlus1,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
    setFeatAtIndex,
    addSpell,
    clearSpells,
    setBackstoryNotes,
    setSpeciesSpellGroupChoice,
    setSpeciesTraitChoice,
    setOriginFeatSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
    setOptionalFeatureOriginFeatAtIndex,
    setOptionalFeatureOriginFeatSkillChoicesAtIndex,
    setSpeciesWeaponChoices,
    setClassWeaponChoicesAtIndex,
    setFeatWeaponChoicesAtIndex,
    setFeatToolChoicesAtIndex,
    setBackgroundToolChoices,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    setClassLanguageChoicesAtIndex,
    setOptionalFeaturesForProgression,
    equipWeapon,
    equipArmor,
    equipShield,
  } = builder;

  const randomize = useCallback(async () => {
    if (isRandomizing) return;

    setIsRandomizing(true);

    const preservedLevel = character.level;

    const setters: RandomizerSetters = {
      resetBuild,
      setLevel,
      setName,
      setLawChaosAlignment,
      setGoodEvilAlignment,
      setClass,
      setClassLocked,
      setSubclass,
      setSpecies,
      setBackground,
      setAbilityScores,
      setAbilityScoreMethod,
      setClassSkillChoicesAtIndex,
      setBackgroundSkillChoices,
      setSpeciesSkillChoices,
      setSpeciesAbilityChoice,
      setBackgroundAsiMode,
      setBackgroundAsiPlus2,
      setBackgroundAsiPlus1,
      setSpeciesOriginFeat,
      setBackgroundOriginFeat,
      setFeatAtIndex,
      addSpell,
      clearSpells,
      setBackstoryNotes,
      setSpeciesSpellGroupChoice,
      setSpeciesTraitChoice,
      setOriginFeatSkillChoices,
      setFeatSkillChoices,
      setExpertiseChoices,
      setOptionalFeatureOriginFeatAtIndex,
      setOptionalFeatureOriginFeatSkillChoicesAtIndex,
      setSpeciesWeaponChoices,
      setClassWeaponChoicesAtIndex,
      setFeatWeaponChoicesAtIndex,
      setFeatToolChoicesAtIndex,
      setBackgroundToolChoices,
      setBackgroundLanguageChoices,
      setSpeciesLanguageChoices,
      setClassLanguageChoicesAtIndex,
      setOptionalFeaturesForProgression,
      equipWeapon: (slot, weapon, rarity) => equipWeapon(slot, weapon, rarity),
      equipArmor,
      equipShield,
    };

    const ctx: RandomizeCharacterContext = {
      useAmellwindHomebrew,
      preservedLevel,
      characterAbilities: character.abilities,
      lockedClass: classLocked ? classRef : null,
      catalogs: {} as RandomizerCatalogs,
      // Replaced by the pipeline once the source catalog loads.
      isAllowedSource: () => false,
      setters,
      rpgbot: { rpgbotData, createLookup },
      addEquipmentBundle,
    };

    try {
      await randomizeCharacterPipeline(ctx);
    } finally {
      setIsRandomizing(false);
    }
  }, [
    useAmellwindHomebrew,
    isRandomizing,
    character.level,
    character.abilities,
    classRef,
    classLocked,
    resetBuild,
    setLevel,
    setName,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setClass,
    setClassLocked,
    setSubclass,
    setSpecies,
    setBackground,
    setAbilityScores,
    setAbilityScoreMethod,
    setClassSkillChoicesAtIndex,
    setBackgroundSkillChoices,
    setSpeciesSkillChoices,
    setSpeciesAbilityChoice,
    setBackgroundAsiMode,
    setBackgroundAsiPlus2,
    setBackgroundAsiPlus1,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
    setFeatAtIndex,
    addSpell,
    clearSpells,
    setBackstoryNotes,
    setSpeciesSpellGroupChoice,
    setSpeciesTraitChoice,
    setOriginFeatSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
    setOptionalFeatureOriginFeatAtIndex,
    setOptionalFeatureOriginFeatSkillChoicesAtIndex,
    setSpeciesWeaponChoices,
    setClassWeaponChoicesAtIndex,
    setFeatWeaponChoicesAtIndex,
    setFeatToolChoicesAtIndex,
    setBackgroundToolChoices,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    setClassLanguageChoicesAtIndex,
    setOptionalFeaturesForProgression,
    equipWeapon,
    equipArmor,
    equipShield,
    rpgbotData,
    createLookup,
    addEquipmentBundle,
  ]);

  return {
    randomize,
    isRandomizing,
    canRandomize: true,
    lockedClassName: classLocked ? (classRef?.name ?? null) : null,
  };
}
