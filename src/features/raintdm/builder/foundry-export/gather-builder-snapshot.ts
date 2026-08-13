import type { CartEntry } from "@/shared/types";
import type { CharacterBuilderContextValue } from "../context/character-builder.types";
import {
  BUILDER_SNAPSHOT_VERSION,
  type BuilderChoiceSnapshot,
} from "./builder-snapshot";

/** Minimal inventory slice required to embed equipment in the builder snapshot. */
export interface GatherBuilderSnapshotInventory {
  items: CartEntry[];
}

/**
 * Gathers the lossless builder-choice snapshot embedded as a Foundry actor flag
 * so that optional selections and equipment metadata survive a re-import.
 */
export function gatherBuilderSnapshot(
  builder: CharacterBuilderContextValue,
  inventory: GatherBuilderSnapshotInventory,
): BuilderChoiceSnapshot {
  return {
    version: BUILDER_SNAPSHOT_VERSION,
    useAmellwindHomebrew: builder.useAmellwindHomebrew,
    abilityScoreMethod: builder.abilityScoreMethod,
    useUnarmedStrike: builder.useUnarmedStrike,
    attacksPerTurnOverride: builder.attacksPerTurnOverride,
    faction: builder.faction,
    personality: builder.personality,

    featSelections: builder.featSelections,
    speciesOriginFeat: builder.speciesOriginFeat,
    backgroundOriginFeat: builder.backgroundOriginFeat,
    optionalFeatureOriginFeats: builder.optionalFeatureOriginFeats,
    originFeatSkillChoices: builder.originFeatSkillChoices,
    optionalFeatureOriginFeatSkillChoices:
      builder.optionalFeatureOriginFeatSkillChoices,
    optionalFeatureSelections: builder.optionalFeatureSelections ?? {},
    speciesSpellGroupChoice: builder.speciesSpellGroupChoice,

    useTashaOrigin: builder.useTashaOrigin,
    tashaPlus2: builder.tashaPlus2,
    tashaPlus1: builder.tashaPlus1,
    speciesAbilityChoices: builder.speciesAbilityChoices,
    backgroundAsiMode: builder.backgroundAsiMode,
    backgroundAsiPlus2: builder.backgroundAsiPlus2,
    backgroundAsiPlus1: builder.backgroundAsiPlus1,

    classSkillChoices: builder.classSkillChoices,
    backgroundSkillChoices: builder.backgroundSkillChoices,
    speciesSkillChoices: builder.speciesSkillChoices,
    featSkillChoices: builder.featSkillChoices,
    expertiseChoices: builder.expertiseChoices,
    classToolChoices: builder.classToolChoices,
    backgroundToolChoices: builder.backgroundToolChoices,
    speciesToolChoices: builder.speciesToolChoices,
    classLanguageChoices: builder.classLanguageChoices,
    backgroundLanguageChoices: builder.backgroundLanguageChoices,
    speciesLanguageChoices: builder.speciesLanguageChoices,
    speciesDefenseChoices: builder.speciesDefenseChoices,

    spellSelections: builder.spellSelections ?? {},

    equipment: {
      mainHand: builder.mainHand,
      offHand: builder.offHand,
      armor: builder.armor,
      shield: builder.equippedShield,
      trinket1: builder.trinket1,
      trinket2: builder.trinket2,
      inventory: inventory.items,
    },
  };
}
