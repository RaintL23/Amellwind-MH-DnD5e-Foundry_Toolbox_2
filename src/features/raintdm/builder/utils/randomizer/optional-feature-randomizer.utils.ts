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
  filterCatalogForProgression,
  filterFeatsForProgression,
  isWeaponMasteryProgression,
} from "@/features/dnd/classes/utils/optional-feature-catalog.utils";
import {
  getWeaponMasteryWeapon,
  isMeleeOnlyWeaponMasteryClass,
} from "@/shared/data/weapon-mastery.data";
import {
  dndFeatToSelection,
  dndOptionalFeatureToSelection,
  featureChoiceToSelection,
  getProgressionPicks,
} from "@/features/raintdm/builder/utils/class-optional-features.utils";
import {
  filterAvailableOptionalFeatures,
  isFightingStyleFeatAvailable,
} from "@/features/raintdm/builder/utils/optional-feature-prerequisites.utils";
import { getWeaponMasteryAvailability } from "@/features/raintdm/builder/utils/weapon-mastery-availability.utils";
import { isFightingStyleProgression } from "@/features/dnd/classes/utils/optional-feature-progression.utils";
import {
  resolveOptionalFeatureRpgbotContext,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import type { RpgbotLookupFn } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import {
  pickMultipleByRpgbot,
  shuffle,
  type RpgbotRatingGetter,
} from "./character-randomizer.utils";
import {
  ARCHETYPE_FIGHTING_STYLES,
  matchesAnyName,
  preferredFeatureChoiceNames,
  sortByPreferredNames,
  type BuildArchetype,
} from "./build-archetype.utils";
import type { ResolvedOptionalFeatureProgression } from "@/features/raintdm/builder/utils/class-optional-features.utils";

// ─── Optional feature progression picker ─────────────────────────────────────

/**
 * Takes `preferred` (in order) first, then fills the rest with RPGBOT picks
 * from `pool`. Items are matched by `keyOf`.
 */
function pickPreferredThenRated<T>(
  pool: T[],
  count: number,
  preferred: T[],
  keyOf: (item: T) => string,
  getRating: RpgbotRatingGetter<T>,
): T[] {
  const picked = preferred.slice(0, count);
  const pickedKeys = new Set(picked.map(keyOf));
  const rest = pool.filter((item) => !pickedKeys.has(keyOf(item)));
  return [
    ...picked,
    ...pickMultipleByRpgbot(rest, count - picked.length, getRating),
  ];
}

/** Warlock invocations that anchor the archetype (Pact of the Blade for gish, Agonizing Blast for casters). */
function preferredInvocationNames(
  className: string,
  archetype: BuildArchetype | null,
): string[] {
  if (className.trim().toLowerCase() !== "warlock" || !archetype) return [];
  return archetype === "gish"
    ? ["Pact of the Blade", "Thirsting Blade"]
    : ["Agonizing Blast"];
}

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
  archetype: BuildArchetype | null,
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

  const preferredNames = preferredInvocationNames(className, archetype);
  const preferred = sortByPreferredNames(
    available.filter((feature) => matchesAnyName(feature.name, preferredNames)),
    (feature) => feature.name,
    preferredNames,
  );
  const picked = pickPreferredThenRated(
    available,
    remaining,
    preferred,
    (feature) => feature.id,
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
  archetype: BuildArchetype | null,
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

  const allAvailable = filtered.filter((feat) =>
    isFightingStyleFeatAvailable(feat, [
      ...alreadyPicked,
      ...otherFsPicks,
    ]),
  );
  if (allAvailable.length === 0) return alreadyPicked;

  // Styles that clash with the archetype's weapons stay out (unless nothing else is left).
  const styles = archetype ? ARCHETYPE_FIGHTING_STYLES[archetype] : null;
  const compatible = styles
    ? allAvailable.filter((feat) => !matchesAnyName(feat.name, styles.blocked))
    : allAvailable;
  const available = compatible.length > 0 ? compatible : allAvailable;
  const preferred = styles
    ? sortByPreferredNames(
        available.filter((feat) => matchesAnyName(feat.name, styles.preferred)),
        (feat) => feat.name,
        styles.preferred,
      ).slice(0, 1)
    : [];

  const rpgbotCtx = resolveOptionalFeatureRpgbotContext({
    className,
    progressionName: progression.name,
    featureTypes: [],
    catalog: "feat",
    isFightingStyle: true,
  });
  const lookup = createLookup(rpgbotCtx);

  const picked = pickPreferredThenRated(
    available,
    remaining,
    preferred,
    (feat) => feat.id,
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
  archetype: BuildArchetype | null,
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
  // Divine Order / Primal Order: Protector & Warden for frontliners, Thaumaturge & Magician for casters.
  const preferredNames = archetype ? preferredFeatureChoiceNames(archetype) : [];
  const ordered = sortByPreferredNames(
    shuffle(available),
    (opt) => opt.name,
    preferredNames,
  ).slice(0, remaining);

  return [
    ...alreadyPicked,
    ...ordered.map((opt) => featureChoiceToSelection(opt, progression.id)),
  ];
}

/**
 * Weapon Mastery picks: loadout weapons first, then the archetype's other
 * weapons, then anything else allowed. Respects weapon proficiency and the
 * melee-only rule (Barbarian).
 */
function pickForWeaponMasteryProgression(
  progression: OptionalFeatureProgression,
  slotCount: number,
  existingSelections: BuilderOptionalFeatureSelection[],
  classData: Class,
  mastery: WeaponMasteryRandomizerContext,
): BuilderOptionalFeatureSelection[] {
  const options = progression.choiceOptions ?? [];
  if (options.length === 0) return [];

  const alreadyPicked = existingSelections.filter(
    (s) => s.progressionId === progression.id,
  );
  const remaining = slotCount - alreadyPicked.length;
  if (remaining <= 0) return alreadyPicked;

  const descriptions = classData.progression.flatMap((row) =>
    row.features
      .filter((feature) => feature.name === "Weapon Mastery")
      .flatMap((feature) => feature.description),
  );
  const meleeOnly = isMeleeOnlyWeaponMasteryClass(descriptions);
  const pickedIds = new Set(alreadyPicked.map((s) => s.id));
  const available = options.filter((opt) => {
    if (pickedIds.has(opt.id)) return false;
    const entry = getWeaponMasteryWeapon(opt.id);
    if (!entry) return true;
    return getWeaponMasteryAvailability(entry, mastery.weaponProficiencies, {
      meleeOnly,
    }).allowed;
  });

  const ordered = sortByPreferredNames(
    shuffle(available),
    (opt) => opt.name,
    mastery.preferredWeaponNames,
  ).slice(0, remaining);

  return [
    ...alreadyPicked,
    ...ordered.map((opt) => featureChoiceToSelection(opt, progression.id)),
  ];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface WeaponMasteryRandomizerContext {
  /** Loadout weapons first, then the archetype's other candidates. */
  preferredWeaponNames: string[];
  weaponProficiencies: string[];
}

export interface OptionalFeatureRandomizerContext {
  classData: Class;
  subclass: Subclass | null;
  classLevel: number;
  optionalCatalog: DndOptionalFeature[];
  featCatalog: DndFeat[];
  createLookup: (ctx: ReturnType<typeof resolveOptionalFeatureRpgbotContext>) => RpgbotLookupFn | null;
  archetype?: BuildArchetype | null;
  /**
   * Weapon Mastery needs the loadout, so the first pass (without this) skips
   * those progressions and the second pass (with it) picks only them.
   */
  weaponMastery?: WeaponMasteryRandomizerContext | null;
}

/**
 * Randomizes selections for all optional-feature progressions.
 * Returns the full selections map; also applies selections via `onSetSelections`.
 *
 * Handles: `optionalfeature`, `feat` (fighting styles), `feature-choice`
 * (Weapon Mastery only when `ctx.weaponMastery` is set).
 */
export function randomizeAllOptionalFeatureProgressions(
  progressions: ResolvedOptionalFeatureProgression[],
  existingSelections: BuilderOptionalFeatureSelections,
  ctx: OptionalFeatureRandomizerContext,
  onSetSelections: (progressionId: string, picks: BuilderOptionalFeatureSelection[]) => void,
): BuilderOptionalFeatureSelections {
  const result: BuilderOptionalFeatureSelections = { ...existingSelections };
  const archetype = ctx.archetype ?? null;

  // Flat list of all selections across all progressions (updated incrementally
  // so later progressions can see what was already picked by earlier ones -
  // important for prerequisites like Pact of the Chain / Pact of the Blade).
  const allSelections: BuilderOptionalFeatureSelection[] = Object.values(result)
    .flat()
    .filter((s): s is BuilderOptionalFeatureSelection => s !== null);

  for (const { progression, slotCount } of progressions) {
    let picks: BuilderOptionalFeatureSelection[];

    if (isWeaponMasteryProgression(progression)) {
      if (!ctx.weaponMastery) continue;
      picks = pickForWeaponMasteryProgression(
        progression,
        slotCount,
        allSelections,
        ctx.classData,
        ctx.weaponMastery,
      );
    } else if (ctx.weaponMastery) {
      continue;
    } else if (progression.catalog === "feature-choice") {
      picks = pickForFeatureChoiceProgression(
        progression,
        slotCount,
        allSelections,
        archetype,
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
        archetype,
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
        archetype,
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
