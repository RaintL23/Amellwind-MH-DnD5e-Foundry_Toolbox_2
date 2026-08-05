import { getListClasses } from "@/features/classes/services/class.service";
import { getAllSpecies } from "@/features/species/services/species.service";
import { getAllBackgrounds } from "@/features/backgrounds/services/background.service";
import {
  getBuilderListDndRaces,
} from "@/features/dnd-races/services/dnd-race.service";
import {
  getListDndBackgrounds,
} from "@/features/dnd-backgrounds/services/dnd-background.service";
import {
  getListDndFeats,
  getAllDndFeats as getAllDndFeatsForFightingStyles,
} from "@/features/dnd-feats/services/dnd-feat.service";
import { getListSpells } from "@/features/spells/services/spell.service";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import {
  getDnd2024LanguageNames,
  getChooseableLanguages,
  loadChooseableLanguages,
} from "@/shared/data/chooseable-languages";
import { pickRandomAlignmentAxes } from "@/features/builder/utils/randomizer/identity-randomizer.utils";
import { delay } from "@/features/builder/utils/randomizer/character-randomizer.utils";
import {
  buildRpgbotLookupsPhase,
  randomizeAbilityScoresPhase,
  randomizeCharacterNamePhase,
  randomizeClassAndSubclassPhase,
  randomizeSpeciesAndBackgroundPhase,
} from "@/features/builder/utils/randomizer/randomize-identity.phase";
import { randomizeOptionalFeaturesPhase } from "@/features/builder/utils/randomizer/randomize-optional-features.phase";
import {
  randomizeExpertisePhase,
  randomizeProficienciesPhase,
} from "@/features/builder/utils/randomizer/randomize-proficiencies.phase";
import {
  randomizeFeatsAndSpellsPhase,
  randomizeInvocationOriginFeatsPhase,
} from "@/features/builder/utils/randomizer/randomize-feats-spells.phase";
import { randomizeEquipmentPhase } from "@/features/builder/utils/randomizer/randomize-equipment.phase";
import type { Class, Subclass } from "@/shared/types";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "@/features/builder/utils/randomizer/randomize-context.types";

function createInitialPipelineState(): RandomizerPipelineState {
  return {
    classData: {} as Class,
    pickedSubclass: null as Subclass | null,
    activeProgressions: [],
    randomFeatureChoiceSelections: {},
    abilityPriority: [],
    abilityScores: {},
    primaryMod: 0,
    speciesLookup: null,
    backgroundLookup: null,
    spellLookup: null,
    featLookup: null,
    speciesName: "",
    backgroundName: "",
    randomizedSpeciesDetail: null,
    randomizedSpeciesLineageChoice: null,
    speciesGrants: [],
    speciesSkillChoices: [],
    backgroundGrants: [],
    backgroundSkillChoices: [],
    speciesOriginFeatSelection: null,
    backgroundOriginFeatSelection: null,
    speciesLanguageChoices: [],
    backgroundLanguageChoices: [],
    speciesLanguageGrants: [],
    backgroundLanguageGrants: [],
    speciesOriginFeatGrant: null,
    backgroundOriginFeatGrant: null,
    randomizedBackgroundDetail: null,
    invocationOriginFeatSlots: [],
    invocationOriginFeatBySlot: new Map(),
    originFeatSkillChoices: [],
    featSkillExclude: new Set(),
    classSkillChoices: {},
  };
}

export async function randomizeCharacterPipeline(
  ctx: RandomizeCharacterContext,
): Promise<void> {
  const { useAmellwindHomebrew, preservedLevel, setters } = ctx;
  const { lawChaos, goodEvil } = pickRandomAlignmentAxes();

  setters.resetBuild();
  setters.setLevel(preservedLevel);
  setters.setLawChaosAlignment(lawChaos);
  setters.setGoodEvilAlignment(goodEvil);
  await delay();

  const [
    classes,
    dndRaces,
    dndBackgrounds,
    amellwindSpecies,
    amellwindBackgrounds,
    dndFeats,
    allSpells,
    /* loadChooseableLanguages — loaded for side-effects only */,
    allOptionalFeatures,
    allFeatCatalog,
  ] = await Promise.all([
    getListClasses(),
    getBuilderListDndRaces(),
    getListDndBackgrounds(),
    useAmellwindHomebrew ? getAllSpecies() : Promise.resolve([]),
    useAmellwindHomebrew ? getAllBackgrounds() : Promise.resolve([]),
    getListDndFeats(),
    getListSpells(),
    loadChooseableLanguages(),
    getAllDndOptionalFeatures(),
    getAllDndFeatsForFightingStyles(),
  ]);

  const dnd2024Languages = getDnd2024LanguageNames();
  const languagePool = useAmellwindHomebrew
    ? getChooseableLanguages()
    : dnd2024Languages;
  const resolvedLanguagePool =
    languagePool.length > 0 ? languagePool : dnd2024Languages;

  ctx.catalogs = {
    classes,
    dndRaces,
    dndBackgrounds,
    amellwindSpecies,
    amellwindBackgrounds,
    dndFeats,
    allSpells,
    allOptionalFeatures,
    allFeatCatalog,
    resolvedLanguagePool,
  };

  const state = createInitialPipelineState();

  const hasClass = await randomizeClassAndSubclassPhase(ctx, state);
  if (!hasClass) return;

  randomizeOptionalFeaturesPhase(ctx, state);

  randomizeAbilityScoresPhase(ctx, state);
  buildRpgbotLookupsPhase(ctx, state);

  await randomizeSpeciesAndBackgroundPhase(ctx, state);

  await randomizeInvocationOriginFeatsPhase(ctx, state);

  await randomizeCharacterNamePhase(ctx, state.speciesName);

  await randomizeProficienciesPhase(ctx, state);

  const featSkillChoicesMap = await randomizeFeatsAndSpellsPhase(ctx, state);

  randomizeExpertisePhase(ctx, state, featSkillChoicesMap);

  randomizeEquipmentPhase(ctx, state);
}
