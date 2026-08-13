import {
  resolveOptionalFeatureRpgbotContext,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { resolveOptionalFeatureProgressions } from "@/features/raintdm/builder/utils/class-optional-features.utils";
import {
  detectIncompleteProgressions,
  randomizeAllOptionalFeatureProgressions,
} from "@/features/raintdm/builder/utils/randomizer/optional-feature-randomizer.utils";
import type { BuilderOptionalFeatureSelections } from "@/shared/types";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";

export function randomizeOptionalFeaturesPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): BuilderOptionalFeatureSelections {
  const { preservedLevel, catalogs, setters, rpgbot } = ctx;
  const { classData, pickedSubclass } = state;

  const activeProgressions = resolveOptionalFeatureProgressions(
    classData,
    pickedSubclass
      ? (classData.subclasses.find((sc) => sc.id === pickedSubclass.id) ?? null)
      : null,
    preservedLevel,
  );

  const optionalFeatureCtx = {
    classData,
    subclass: pickedSubclass
      ? (classData.subclasses.find((sc) => sc.id === pickedSubclass.id) ?? null)
      : null,
    classLevel: preservedLevel,
    optionalCatalog: catalogs.allOptionalFeatures,
    featCatalog: catalogs.allFeatCatalog,
    createLookup: (rpgCtx: ReturnType<typeof resolveOptionalFeatureRpgbotContext>) =>
      rpgbot.createLookup(rpgCtx),
  };

  let randomFeatureChoiceSelections: BuilderOptionalFeatureSelections =
    randomizeAllOptionalFeatureProgressions(
      activeProgressions,
      {},
      optionalFeatureCtx,
      setters.setOptionalFeaturesForProgression,
    );

  const MAX_FILL_PASSES = 2;
  for (let pass = 0; pass < MAX_FILL_PASSES; pass++) {
    const incomplete = detectIncompleteProgressions(
      activeProgressions,
      randomFeatureChoiceSelections,
    );
    if (incomplete.length === 0) break;

    randomFeatureChoiceSelections = randomizeAllOptionalFeatureProgressions(
      incomplete,
      randomFeatureChoiceSelections,
      optionalFeatureCtx,
      setters.setOptionalFeaturesForProgression,
    );
  }

  state.activeProgressions = activeProgressions;
  state.randomFeatureChoiceSelections = randomFeatureChoiceSelections;

  return randomFeatureChoiceSelections;
}
