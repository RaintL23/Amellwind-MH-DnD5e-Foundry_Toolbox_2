import { getListClasses } from "@/features/dnd/classes/services/class.service";
import { getAllSpecies } from "@/features/amellwind/species/services/species.service";
import { getAllBackgrounds } from "@/features/amellwind/backgrounds/services/background.service";
import {
  getBuilderListDndRaces,
} from "@/features/dnd/races/services/dnd-race.service";
import {
  getListDndBackgrounds,
} from "@/features/dnd/backgrounds/services/dnd-background.service";
import {
  getListDndFeats,
  getAllDndFeats as getAllDndFeatsForFightingStyles,
} from "@/features/dnd/feats/services/dnd-feat.service";
import { getListSpells } from "@/features/dnd/spells/services/spell.service";
import { getAllDndOptionalFeatures } from "@/features/dnd/optionalfeatures/services/dnd-optionalfeature.service";
import {
  getDndArmors,
  getDndWeapons,
} from "@/features/dnd/items/services/dnd-equipment.service";
import { getSourceCatalog } from "@/shared/services/source-catalog.service";
import {
  getDnd2024LanguageNames,
  getChooseableLanguages,
  loadChooseableLanguages,
} from "@/shared/data/chooseable-languages";
import { pickRandomAlignmentAxes } from "@/features/raintdm/builder/utils/randomizer/identity-randomizer.utils";
import { delay } from "@/features/raintdm/builder/utils/randomizer/character-randomizer.utils";
import {
  buildRpgbotLookupsPhase,
  randomizeAbilityScoresPhase,
  randomizeCharacterNamePhase,
  randomizeClassAndSubclassPhase,
  randomizeSpeciesAndBackgroundPhase,
} from "@/features/raintdm/builder/utils/randomizer/randomize-identity.phase";
import {
  randomizeOptionalFeaturesPhase,
  randomizeWeaponMasteryPhase,
} from "@/features/raintdm/builder/utils/randomizer/randomize-optional-features.phase";
import {
  randomizeExpertisePhase,
  randomizeProficienciesPhase,
} from "@/features/raintdm/builder/utils/randomizer/randomize-proficiencies.phase";
import {
  randomizeFeatsAndSpellsPhase,
  randomizeInvocationOriginFeatsPhase,
} from "@/features/raintdm/builder/utils/randomizer/randomize-feats-spells.phase";
import { randomizeEquipmentPhase } from "@/features/raintdm/builder/utils/randomizer/randomize-equipment.phase";
import { planLoadoutPhase } from "@/features/raintdm/builder/utils/randomizer/randomize-loadout.phase";
import {
  createRandomizerSourceFilter,
  filterRandomizerCatalogs,
} from "@/features/raintdm/builder/utils/randomizer/randomizer-sources.utils";
import type { ArmorItem, Class, Subclass, Weapon } from "@/shared/types";
import type { SourceCatalogEntry } from "@/shared/services/source-catalog.service";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "@/features/raintdm/builder/utils/randomizer/randomize-context.types";

function createInitialPipelineState(): RandomizerPipelineState {
  return {
    classData: {} as Class,
    pickedSubclass: null as Subclass | null,
    archetype: { archetype: "caster" },
    originAbilityBonuses: {},
    loadout: null,
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

/**
 * Order: class (lock / shuffled bag) → subclass → archetype → abilities →
 * species & background → optional features → loadout plan → Weapon Mastery →
 * invocation origin feats → name → proficiencies → spells & level feats →
 * expertise → starting equipment + equip (D&D) → backstory.
 * Every D&D catalog is limited to 2024+ official sources first.
 */
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
    sourceCatalog,
    dndWeapons,
    dndArmors,
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
    getSourceCatalog().catch(() => new Map<string, SourceCatalogEntry>()),
    useAmellwindHomebrew
      ? Promise.resolve<Weapon[]>([])
      : getDndWeapons(true).catch(() => [] as Weapon[]),
    useAmellwindHomebrew
      ? Promise.resolve<ArmorItem[]>([])
      : getDndArmors(true).catch(() => [] as ArmorItem[]),
  ]);

  const dnd2024Languages = getDnd2024LanguageNames();
  const languagePool = useAmellwindHomebrew
    ? getChooseableLanguages()
    : dnd2024Languages;
  const resolvedLanguagePool =
    languagePool.length > 0 ? languagePool : dnd2024Languages;

  ctx.isAllowedSource = createRandomizerSourceFilter(sourceCatalog);
  ctx.catalogs = filterRandomizerCatalogs(
    {
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
      dndWeapons,
      dndArmors,
    },
    ctx.isAllowedSource,
  );

  const state = createInitialPipelineState();

  const hasClass = await randomizeClassAndSubclassPhase(ctx, state);
  if (!hasClass) return;

  randomizeAbilityScoresPhase(ctx, state);
  buildRpgbotLookupsPhase(ctx, state);

  await randomizeSpeciesAndBackgroundPhase(ctx, state);

  randomizeOptionalFeaturesPhase(ctx, state);
  planLoadoutPhase(ctx, state);
  randomizeWeaponMasteryPhase(ctx, state);

  await randomizeInvocationOriginFeatsPhase(ctx, state);

  await randomizeCharacterNamePhase(ctx, state.speciesName);

  await randomizeProficienciesPhase(ctx, state);

  const featSkillChoicesMap = await randomizeFeatsAndSpellsPhase(ctx, state);

  randomizeExpertisePhase(ctx, state, featSkillChoicesMap);

  randomizeEquipmentPhase(ctx, state);
}
