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
    resetBuild,
    setLevel,
    setName,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setClass,
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
    setOriginFeatSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
    setOptionalFeatureOriginFeatAtIndex,
    setOptionalFeatureOriginFeatSkillChoicesAtIndex,
    setBackgroundToolChoices,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    setClassLanguageChoicesAtIndex,
    setOptionalFeaturesForProgression,
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
      setOriginFeatSkillChoices,
      setFeatSkillChoices,
      setExpertiseChoices,
      setOptionalFeatureOriginFeatAtIndex,
      setOptionalFeatureOriginFeatSkillChoicesAtIndex,
      setBackgroundToolChoices,
      setBackgroundLanguageChoices,
      setSpeciesLanguageChoices,
      setClassLanguageChoicesAtIndex,
      setOptionalFeaturesForProgression,
    };

    const ctx: RandomizeCharacterContext = {
      useAmellwindHomebrew,
      preservedLevel,
      characterAbilities: character.abilities,
      catalogs: {} as RandomizerCatalogs,
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
    resetBuild,
    setLevel,
    setName,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setClass,
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
    setOriginFeatSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
    setOptionalFeatureOriginFeatAtIndex,
    setOptionalFeatureOriginFeatSkillChoicesAtIndex,
    setBackgroundToolChoices,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    setClassLanguageChoicesAtIndex,
    setOptionalFeaturesForProgression,
    rpgbotData,
    createLookup,
    addEquipmentBundle,
  ]);

  return {
    randomize,
    isRandomizing,
    canRandomize: true,
  };
}
