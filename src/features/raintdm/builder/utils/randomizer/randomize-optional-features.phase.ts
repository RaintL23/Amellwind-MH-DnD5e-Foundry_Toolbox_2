import {
  resolveOptionalFeatureRpgbotContext,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { resolveOptionalFeatureProgressions } from "@/features/raintdm/builder/utils/class-optional-features.utils";
import {
  detectIncompleteProgressions,
  randomizeAllOptionalFeatureProgressions,
  type OptionalFeatureRandomizerContext,
  type WeaponMasteryRandomizerContext,
} from "@/features/raintdm/builder/utils/randomizer/optional-feature-randomizer.utils";
import { isWeaponMasteryProgression } from "@/features/dnd/classes/utils/optional-feature-catalog.utils";
import type { BuilderOptionalFeatureSelections } from "@/shared/types";
import type {
  RandomizeCharacterContext,
  RandomizerPipelineState,
} from "./randomize-context.types";

function buildOptionalFeatureContext(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
  weaponMastery: WeaponMasteryRandomizerContext | null,
): OptionalFeatureRandomizerContext {
  const { preservedLevel, catalogs, rpgbot } = ctx;
  const { classData, pickedSubclass } = state;
  return {
    classData,
    subclass: pickedSubclass
      ? (classData.subclasses.find((sc) => sc.id === pickedSubclass.id) ?? null)
      : null,
    classLevel: preservedLevel,
    optionalCatalog: catalogs.allOptionalFeatures,
    featCatalog: catalogs.allFeatCatalog,
    createLookup: (rpgCtx: ReturnType<typeof resolveOptionalFeatureRpgbotContext>) =>
      rpgbot.createLookup(rpgCtx),
    archetype: state.archetype.archetype,
    weaponMastery,
  };
}

/** Every optional-feature progression except Weapon Mastery (needs the loadout first). */
export function randomizeOptionalFeaturesPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): BuilderOptionalFeatureSelections {
  const { preservedLevel, setters } = ctx;
  const { classData, pickedSubclass } = state;

  const activeProgressions = resolveOptionalFeatureProgressions(
    classData,
    pickedSubclass
      ? (classData.subclasses.find((sc) => sc.id === pickedSubclass.id) ?? null)
      : null,
    preservedLevel,
  );

  const optionalFeatureCtx = buildOptionalFeatureContext(ctx, state, null);

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
    ).filter(({ progression }) => !isWeaponMasteryProgression(progression));
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

/** Weapon Mastery picks that follow the loadout (both modes). */
export function randomizeWeaponMasteryPhase(
  ctx: RandomizeCharacterContext,
  state: RandomizerPipelineState,
): void {
  const { loadout } = state;
  const masteryProgressions = state.activeProgressions.filter(({ progression }) =>
    isWeaponMasteryProgression(progression),
  );
  if (masteryProgressions.length === 0 || !loadout) return;

  const preferredWeaponNames = [
    ...new Set(
      [
        loadout.mainHand,
        loadout.offHand,
        loadout.backup,
        ...loadout.candidates.main,
        ...loadout.candidates.offHand,
        ...loadout.candidates.backup,
      ].filter((name): name is string => !!name),
    ),
  ];

  state.randomFeatureChoiceSelections = randomizeAllOptionalFeatureProgressions(
    masteryProgressions,
    state.randomFeatureChoiceSelections,
    buildOptionalFeatureContext(ctx, state, {
      preferredWeaponNames,
      weaponProficiencies: loadout.weaponProficiencies,
    }),
    ctx.setters.setOptionalFeaturesForProgression,
  );
}
