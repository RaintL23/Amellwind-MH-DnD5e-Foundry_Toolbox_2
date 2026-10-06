import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  OptionalFeatureProgression,
} from "@/shared/types";
import { isFeatureChoiceProgression } from "@/features/dnd/classes/utils/optional-feature-catalog.utils";

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function progressionParentKeys(progression: OptionalFeatureProgression): string[] {
  const lower = normalizeName(progression.name);
  const stripped = lower.replace(/ options$/i, "").trim();
  return stripped && stripped !== lower ? [lower, stripped] : [lower];
}

/** Lowercased names of every option across feature-choice progressions. */
export function collectFeatureChoiceOptionNames(
  progressions: OptionalFeatureProgression[],
): Set<string> {
  const names = new Set<string>();
  for (const progression of progressions) {
    if (!isFeatureChoiceProgression(progression)) continue;
    for (const option of progression.choiceOptions ?? []) {
      names.add(normalizeName(option.name));
    }
  }
  return names;
}

/** Lowercased names / ids of the character's selected feature-choice options. */
export function collectSelectedFeatureChoiceKeys(
  progressions: OptionalFeatureProgression[],
  selections: BuilderOptionalFeatureSelections,
): Set<string> {
  const keys = new Set<string>();
  for (const progression of progressions) {
    if (!isFeatureChoiceProgression(progression)) continue;
    const picks = (selections[progression.id] ?? []).filter(
      (pick): pick is BuilderOptionalFeatureSelection => pick !== null,
    );
    for (const pick of picks) {
      keys.add(normalizeName(pick.name));
      keys.add(normalizeName(pick.id));
      const option = (progression.choiceOptions ?? []).find(
        (candidate) =>
          candidate.id === pick.id ||
          normalizeName(candidate.name) === normalizeName(pick.name),
      );
      if (option) {
        keys.add(normalizeName(option.name));
        keys.add(normalizeName(option.id));
      }
    }
  }
  return keys;
}

/**
 * True when `featureName` is a feature-choice option that this character did
 * not pick (e.g. Cleric Thaumaturge when Protector was chosen).
 */
export function isUnselectedFeatureChoiceOption(
  featureName: string,
  progressions: OptionalFeatureProgression[],
  selections: BuilderOptionalFeatureSelections,
): boolean {
  const key = normalizeName(featureName);
  if (!key) return false;
  const optionNames = collectFeatureChoiceOptionNames(progressions);
  if (!optionNames.has(key)) return false;
  const selected = collectSelectedFeatureChoiceKeys(progressions, selections);
  return !selected.has(key);
}

/**
 * Parent menu features for optionalfeature / feat catalogs (Fighting Style,
 * Eldritch Invocations, …) should be omitted from sheets when picks exist.
 * Feature-choice parents (Divine Order, Totem Spirit) keep their intro.
 */
export function isOmittableOptionalFeatureParent(
  featureName: string,
  progressions: OptionalFeatureProgression[],
  selections: BuilderOptionalFeatureSelections,
): boolean {
  const key = normalizeName(featureName);
  for (const progression of progressions) {
    if (isFeatureChoiceProgression(progression)) continue;
    if (!progressionParentKeys(progression).includes(key)) continue;
    const picks = (selections[progression.id] ?? []).filter(Boolean);
    if (picks.length > 0) return true;
  }
  return false;
}

/** Whether a class/subclass feature row should be hidden on the sheet / PDF. */
export function shouldOmitClassFeatureForChoices(
  featureName: string,
  progressions: OptionalFeatureProgression[],
  selections: BuilderOptionalFeatureSelections,
): boolean {
  if (isUnselectedFeatureChoiceOption(featureName, progressions, selections)) {
    return true;
  }
  return isOmittableOptionalFeatureParent(
    featureName,
    progressions,
    selections,
  );
}

/**
 * Rebuild a feature-choice parent description as intro + chosen option bodies.
 * Falls back to `fullDescription` when there are no structured options/picks.
 */
export function resolveFeatureChoiceParentDescription(
  fullDescription: string[],
  progression: OptionalFeatureProgression | null | undefined,
  picks: BuilderOptionalFeatureSelection[],
): string {
  const options = progression?.choiceOptions ?? [];
  if (!progression || !isFeatureChoiceProgression(progression) || !options.length) {
    return fullDescription.join("\n").trim();
  }

  const selected = picks
    .map(
      (pick) =>
        options.find(
          (option) =>
            option.id === pick.id ||
            normalizeName(option.name) === normalizeName(pick.name),
        ) ?? null,
    )
    .filter((option): option is NonNullable<typeof option> => option !== null);

  if (selected.length === 0) {
    return fullDescription.join("\n").trim();
  }

  const optionKeys = new Set(
    options.flatMap((option) => [
      normalizeName(option.name),
      ...option.entries.map((line) => normalizeName(line)),
    ]),
  );

  const intro = fullDescription.filter((line) => {
    const lower = normalizeName(line);
    if (!lower) return false;
    if (optionKeys.has(lower)) return false;
    return !options.some((option) => {
      const name = normalizeName(option.name);
      return (
        lower === name ||
        lower.startsWith(`${name}:`) ||
        lower.startsWith(`• ${name}`) ||
        lower.startsWith(`- ${name}`)
      );
    });
  });

  const chosenBlocks = selected.flatMap((option) => {
    if (option.entries.length === 1) {
      return [`${option.name}: ${option.entries[0]}`];
    }
    return [option.name, ...option.entries];
  });

  return [...intro, ...chosenBlocks].filter(Boolean).join("\n\n").trim();
}

export function findFeatureChoiceProgressionForFeature(
  featureName: string,
  progressions: OptionalFeatureProgression[],
): OptionalFeatureProgression | null {
  const key = normalizeName(featureName);
  for (const progression of progressions) {
    if (!isFeatureChoiceProgression(progression)) continue;
    if (progressionParentKeys(progression).includes(key)) return progression;
  }
  return null;
}
