import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  Class,
  DndFeat,
  DndOptionalFeature,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import {
  collectOptionPoolRefs,
  dndFeatToSelection,
  dndOptionalFeatureToSelection,
  filterCatalogForProgression,
  filterFeatsForProgression,
  featureChoiceToSelection,
  getProgressionPicks,
} from "@/features/builder/utils/class-optional-features.utils";
import {
  filterAvailableOptionalFeatures,
  isFightingStyleFeatAvailable,
} from "@/features/builder/utils/optional-feature-prerequisites.utils";
import { isFightingStyleProgression } from "@/features/classes/utils/optional-feature-progression.utils";
import {
  resolveOptionalFeatureRpgbotContext,
} from "@/features/builder/data/rpgbot-ratings.utils";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import { pickMultipleByRpgbot, shuffle } from "./character-randomizer.utils";
import type { ResolvedOptionalFeatureProgression } from "@/features/builder/utils/class-optional-features.utils";

// ─── Optional feature progression picker ─────────────────────────────────────

function pickForOptionalFeatureProgression(
  progression: OptionalFeatureProgression,
  slotCount: number,
  optionalCatalog: DndOptionalFeature[],
  existingSelections: BuilderOptionalFeatureSelection[],
  className: string,
  classLevel: number,
  classData: Class,
  subclass: Subclass | null,
  createLookup: (ctx: ReturnType<typeof resolveOptionalFeatureRpgbotContext>) => RpgbotLookupFn | null,
): BuilderOptionalFeatureSelection[] {
  const alreadyPicked = existingSelections.filter(
    (s) => s.progressionId === progression.id,
  );
  const remaining = slotCount - alreadyPicked.length;
  if (remaining <= 0) return alreadyPicked;

  const poolRefs = collectOptionPoolRefs(classData, subclass, classLevel, "optionalfeature");
  const filtered = filterCatalogForProgression(
    optionalCatalog,
    poolRefs,
    progression.featureTypes,
  );

  const available = filterAvailableOptionalFeatures(filtered, {
    className,
    classLevel,
    selectedFeatures: existingSelections,
    progressionId: progression.id,
  });

  if (available.length === 0) return alreadyPicked;

  const rpgbotCtx = resolveOptionalFeatureRpgbotContext({
    className,
    progressionName: progression.name,
    featureTypes: progression.featureTypes,
    catalog: progression.catalog,
    isFightingStyle: false,
  });
  const lookup = createLookup(rpgbotCtx);

  const picked = pickMultipleByRpgbot(
    available,
    remaining,
    (feature) => lookup?.(feature.name, feature.source) ?? null,
  );

  return [
    ...alreadyPicked,
    ...picked.map((f) => dndOptionalFeatureToSelection(f, progression.id)),
  ];
}

function pickForFightingStyleProgression(
  progression: OptionalFeatureProgression,
  slotCount: number,
  featCatalog: DndFeat[],
  existingSelections: BuilderOptionalFeatureSelection[],
  className: string,
  classLevel: number,
  classData: Class,
  subclass: Subclass | null,
  allProgressions: ResolvedOptionalFeatureProgression[],
  createLookup: (ctx: ReturnType<typeof resolveOptionalFeatureRpgbotContext>) => RpgbotLookupFn | null,
): BuilderOptionalFeatureSelection[] {
  const alreadyPicked = existingSelections.filter(
    (s) => s.progressionId === progression.id,
  );
  const remaining = slotCount - alreadyPicked.length;
  if (remaining <= 0) return alreadyPicked;

  const poolRefs = collectOptionPoolRefs(classData, subclass, classLevel, "feat");
  const filtered = filterFeatsForProgression(
    featCatalog,
    poolRefs,
    progression.featCategories ?? ["FS"],
  );

  // Collect all fighting-style picks across OTHER progressions to avoid duplicates
  const otherFsPicks: BuilderOptionalFeatureSelection[] = [];
  for (const { progression: p } of allProgressions) {
    if (p.id === progression.id) continue;
    if (!isFightingStyleProgression(p)) continue;
    const picks = existingSelections.filter((s) => s.progressionId === p.id);
    otherFsPicks.push(...picks);
  }

  const available = filtered.filter((feat) =>
    isFightingStyleFeatAvailable(feat, [
      ...alreadyPicked,
      ...otherFsPicks,
    ]),
  );

  if (available.length === 0) return alreadyPicked;

  const rpgbotCtx = resolveOptionalFeatureRpgbotContext({
    className,
    progressionName: progression.name,
    featureTypes: [],
    catalog: "feat",
    isFightingStyle: true,
  });
  const lookup = createLookup(rpgbotCtx);

  const picked = pickMultipleByRpgbot(
    available,
    remaining,
    (feat) => lookup?.(feat.name, feat.source) ?? null,
  );

  return [
    ...alreadyPicked,
    ...picked.map((f) => dndFeatToSelection(f, progression.id)),
  ];
}

function pickForFeatureChoiceProgression(
  progression: OptionalFeatureProgression,
  slotCount: number,
  existingSelections: BuilderOptionalFeatureSelection[],
): BuilderOptionalFeatureSelection[] {
  const options = progression.choiceOptions ?? [];
  if (options.length === 0) return [];

  if (progression.pickMode === "all") {
    return options.map((opt) => featureChoiceToSelection(opt, progression.id));
  }

  const alreadyPicked = existingSelections.filter(
    (s) => s.progressionId === progression.id,
  );
  const remaining = slotCount - alreadyPicked.length;
  if (remaining <= 0) return alreadyPicked;

  const pickedIds = new Set(alreadyPicked.map((s) => s.id));
  const available = options.filter((opt) => !pickedIds.has(opt.id));
  const shuffled = shuffle(available).slice(0, remaining);

  return [
    ...alreadyPicked,
    ...shuffled.map((opt) => featureChoiceToSelection(opt, progression.id)),
  ];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface OptionalFeatureRandomizerContext {
  classData: Class;
  subclass: Subclass | null;
  classLevel: number;
  optionalCatalog: DndOptionalFeature[];
  featCatalog: DndFeat[];
  createLookup: (ctx: ReturnType<typeof resolveOptionalFeatureRpgbotContext>) => RpgbotLookupFn | null;
}

/**
 * Randomizes selections for all optional-feature progressions.
 * Returns the full selections map; also applies selections via `onSetSelections`.
 *
 * Handles: `optionalfeature`, `feat` (fighting styles), `feature-choice`.
 */
export function randomizeAllOptionalFeatureProgressions(
  progressions: ResolvedOptionalFeatureProgression[],
  existingSelections: BuilderOptionalFeatureSelections,
  ctx: OptionalFeatureRandomizerContext,
  onSetSelections: (progressionId: string, picks: BuilderOptionalFeatureSelection[]) => void,
): BuilderOptionalFeatureSelections {
  const result: BuilderOptionalFeatureSelections = { ...existingSelections };

  // Flat list of all selections across all progressions (updated incrementally
  // so later progressions can see what was already picked by earlier ones -
  // important for prerequisites like Pact of the Chain / Pact of the Blade).
  const allSelections: BuilderOptionalFeatureSelection[] = Object.values(result)
    .flat()
    .filter((s): s is BuilderOptionalFeatureSelection => s !== null);

  for (const { progression, slotCount } of progressions) {
    let picks: BuilderOptionalFeatureSelection[];

    if (progression.catalog === "feature-choice") {
      picks = pickForFeatureChoiceProgression(
        progression,
        slotCount,
        allSelections,
      );
    } else if (progression.catalog === "feat") {
      picks = pickForFightingStyleProgression(
        progression,
        slotCount,
        ctx.featCatalog,
        allSelections,
        ctx.classData.name,
        ctx.classLevel,
        ctx.classData,
        ctx.subclass,
        progressions,
        ctx.createLookup,
      );
    } else {
      // optionalfeature (Eldritch Invocations, Metamagic, Maneuvers, etc.)
      picks = pickForOptionalFeatureProgression(
        progression,
        slotCount,
        ctx.optionalCatalog,
        allSelections,
        ctx.classData.name,
        ctx.classLevel,
        ctx.classData,
        ctx.subclass,
        ctx.createLookup,
      );
    }

    if (picks.length > 0) {
      result[progression.id] = picks;
      onSetSelections(progression.id, picks);
      // Add new picks to the running list so subsequent progressions see them
      for (const pick of picks) {
        if (!allSelections.some((s) => s.id === pick.id && s.progressionId === pick.progressionId)) {
          allSelections.push(pick);
        }
      }
    }
  }

  return result;
}

/**
 * Checks all progressions and returns which ones still have fewer picks than
 * required. Used for the completeness-check pass.
 */
export function detectIncompleteProgressions(
  progressions: ResolvedOptionalFeatureProgression[],
  selections: BuilderOptionalFeatureSelections,
): ResolvedOptionalFeatureProgression[] {
  return progressions.filter(({ progression, slotCount }) => {
    const picks = getProgressionPicks(selections, progression.id);
    return picks.length < slotCount;
  });
}
