import type {
  RpgbotLookupContext,
  RpgbotLookupFn,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import type { RpgbotRatingsData } from "@/features/raintdm/builder/data/rpgbot-ratings.types";
import type { AbilityScoreGenerationMethod } from "@/features/raintdm/builder/utils/ability-scores";
import type { ResolvedOptionalFeatureProgression } from "@/features/raintdm/builder/utils/class-optional-features.utils";
import type { OptionalFeatureOriginFeatSlot } from "@/features/raintdm/builder/utils/optional-feature-feat-grants.utils";
import type {
  AbilityKey,
  AbilityScores,
  Background,
  BuilderFeatSelection,
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  BuilderSpellSelection,
  CartEntry,
  CharacterSelectionRef,
  Class,
  DndFeat,
  DndOptionalFeature,
  DndRace,
  SkillKey,
  Species,
  Spell,
  Subclass,
} from "@/shared/types";
import type { DndBackground } from "@/shared/types/dnd-background.types";
import type {
  NamedProficiencyGrant,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";

export function toSelectionRef(id: string, name: string): CharacterSelectionRef {
  return { id, name, subraceId: null, subraceName: null };
}

export interface RandomizerCatalogs {
  classes: Class[];
  dndRaces: DndRace[];
  dndBackgrounds: DndBackground[];
  amellwindSpecies: Species[];
  amellwindBackgrounds: Background[];
  dndFeats: DndFeat[];
  allSpells: Spell[];
  allOptionalFeatures: DndOptionalFeature[];
  allFeatCatalog: DndFeat[];
  resolvedLanguagePool: readonly string[];
}

export interface RandomizerSetters {
  resetBuild: () => void;
  setLevel: (level: number) => void;
  setName: (name: string) => void;
  setLawChaosAlignment: (axis: "L" | "N" | "C") => void;
  setGoodEvilAlignment: (axis: "G" | "N" | "E") => void;
  setClass: (selection: CharacterSelectionRef | null) => void;
  setSubclass: (selection: CharacterSelectionRef | null) => void;
  setSpecies: (selection: CharacterSelectionRef | null) => void;
  setBackground: (selection: CharacterSelectionRef | null) => void;
  setAbilityScores: (abilities: Partial<AbilityScores>) => void;
  setAbilityScoreMethod: (method: AbilityScoreGenerationMethod) => void;
  setClassSkillChoicesAtIndex: (grantIndex: number, choices: SkillKey[]) => void;
  setBackgroundSkillChoices: (choices: SkillKey[]) => void;
  setSpeciesSkillChoices: (choices: SkillKey[]) => void;
  setSpeciesAbilityChoice: (index: number, ability: AbilityKey | null) => void;
  setBackgroundAsiMode: (mode: "plus2plus1" | "plus1each" | null) => void;
  setBackgroundAsiPlus2: (ability: AbilityKey | null) => void;
  setBackgroundAsiPlus1: (ability: AbilityKey | null) => void;
  setSpeciesOriginFeat: (selection: BuilderFeatSelection | null) => void;
  setBackgroundOriginFeat: (selection: BuilderFeatSelection | null) => void;
  setFeatAtIndex: (index: number, selection: BuilderFeatSelection | null) => void;
  addSpell: (level: number, spell: BuilderSpellSelection) => void;
  clearSpells: () => void;
  setBackstoryNotes: (value: string | ((current: string) => string)) => void;
  setSpeciesSpellGroupChoice: (name: string | null) => void;
  setOriginFeatSkillChoices: (choices: SkillKey[]) => void;
  setFeatSkillChoices: (slotIndex: number, choices: SkillKey[]) => void;
  setExpertiseChoices: (grantId: string, choices: SkillKey[]) => void;
  setOptionalFeatureOriginFeatAtIndex: (
    index: number,
    selection: BuilderFeatSelection | null,
  ) => void;
  setOptionalFeatureOriginFeatSkillChoicesAtIndex: (
    slotIndex: number,
    choices: SkillKey[],
  ) => void;
  setBackgroundToolChoices: (choices: string[]) => void;
  setBackgroundLanguageChoices: (choices: string[]) => void;
  setSpeciesLanguageChoices: (choices: string[]) => void;
  setClassLanguageChoicesAtIndex: (grantIndex: number, choices: string[]) => void;
  setOptionalFeaturesForProgression: (
    progressionId: string,
    picks: BuilderOptionalFeatureSelection[],
  ) => void;
}

export interface RandomizerRpgbotContext {
  rpgbotData: RpgbotRatingsData | null;
  createLookup: (context: RpgbotLookupContext | null) => RpgbotLookupFn | null;
}

export interface RandomizeCharacterContext {
  useAmellwindHomebrew: boolean;
  preservedLevel: number;
  characterAbilities: AbilityScores;
  catalogs: RandomizerCatalogs;
  setters: RandomizerSetters;
  rpgbot: RandomizerRpgbotContext;
  addEquipmentBundle: (entries: CartEntry[]) => void;
}

export interface RandomizerPipelineState {
  classData: Class;
  pickedSubclass: Subclass | null;
  activeProgressions: ResolvedOptionalFeatureProgression[];
  randomFeatureChoiceSelections: BuilderOptionalFeatureSelections;
  abilityPriority: AbilityKey[];
  abilityScores: Partial<AbilityScores>;
  primaryMod: number;
  speciesLookup: RpgbotLookupFn | null;
  backgroundLookup: RpgbotLookupFn | null;
  spellLookup: RpgbotLookupFn | null;
  featLookup: RpgbotLookupFn | null;
  speciesName: string;
  backgroundName: string;
  randomizedSpeciesDetail: DndRace | null;
  randomizedSpeciesLineageChoice: string | null;
  speciesGrants: SkillProficiencyGrant[];
  speciesSkillChoices: SkillKey[];
  backgroundGrants: SkillProficiencyGrant[];
  backgroundSkillChoices: SkillKey[];
  speciesOriginFeatSelection: BuilderFeatSelection | null;
  backgroundOriginFeatSelection: BuilderFeatSelection | null;
  speciesLanguageChoices: string[];
  backgroundLanguageChoices: string[];
  speciesLanguageGrants: NamedProficiencyGrant[];
  backgroundLanguageGrants: NamedProficiencyGrant[];
  speciesOriginFeatGrant: OriginFeatGrant | null;
  backgroundOriginFeatGrant: OriginFeatGrant | null;
  randomizedBackgroundDetail: DndBackground | null;
  invocationOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  invocationOriginFeatBySlot: Map<number, BuilderFeatSelection>;
  originFeatSkillChoices: SkillKey[];
  featSkillExclude: Set<SkillKey>;
  classSkillChoices: Record<number, SkillKey[]>;
}
