import type {
  BuilderOptionalFeatureSelections,
  Class,
  OptionalFeatureProgression,
  Species,
  Subclass,
} from "@/shared/types";
import { getOptionalFeatureCountAtLevel } from "@/features/dnd/classes/utils/optional-feature-progression.utils";

/**
 * Features whose content is handled elsewhere (spell list, spell slots) and
 * should be omitted from the CLASS FEATURES text fields.
 */
const OMITTED_FEATURE_NAMES = new Set([
  "spellcasting",
  "pact magic",
]);

function isOmittedFeature(name: string): boolean {
  return OMITTED_FEATURE_NAMES.has(name.toLowerCase().trim());
}

function formatFeatureEntry(name: string, description: string[]): string {
  const desc = description.join("\n").trim();
  return desc ? `${name}\n${desc}` : name;
}

/**
 * Approximate character capacity for one CLASS FEATURES field at font size 7.
 * Used to decide where to cascade text from field 1 into field 2.
 */
const FIELD_CHAR_CAPACITY = 1200;

/**
 * Lookup map: optional feature / feat id → description lines.
 * Used to enrich the PDF with the actual description of each picked option.
 */
export type OptionalFeatureDescMap = Map<string, string[]>;

/**
 * Builds a display name for a progression, stripping the trailing " Options" suffix
 * that is common in 5etools data (e.g. "Fighting Style Options" → "Fighting Style").
 */
function progressionLabel(name: string): string {
  return name.replace(/ options$/i, "").trim();
}

/**
 * Returns a Set of lowercase feature names that are handled by the provided
 * optional-feature progressions. Class features whose names match will be
 * replaced in the PDF by the user's actual selections.
 */
function buildProgressionHandledNames(
  progressions: OptionalFeatureProgression[],
): Set<string> {
  const names = new Set<string>();
  for (const p of progressions) {
    const lower = p.name.toLowerCase();
    names.add(lower);
    // "Fighting Style Options" → also skip "Fighting Style"
    names.add(lower.replace(/ options$/i, "").trim());
  }
  return names;
}

/**
 * Formats the user's selections for a single progression into a PDF-ready
 * string. Returns null when no selections are available.
 */
function formatProgressionSelections(
  progression: OptionalFeatureProgression,
  selections: BuilderOptionalFeatureSelections,
  descMap: OptionalFeatureDescMap,
): string | null {
  const picks = (selections[progression.id] ?? []).filter(
    (s): s is NonNullable<typeof s> => s !== null,
  );

  if (picks.length === 0) return null;

  const label = progressionLabel(progression.name);

  if (progression.catalog === "feature-choice") {
    // For feature-choice progressions (Weapon Mastery, patron sub-type, etc.)
    // build a compact list: "Label\nOption1 (desc), Option2 (desc), ..."
    const optionMap = new Map(
      (progression.choiceOptions ?? []).map((o) => [o.id, o]),
    );
    const parts = picks.map((pick) => {
      const opt = optionMap.get(pick.id);
      const desc = opt?.entries[0] ?? "";
      return desc ? `${pick.name} (${desc})` : pick.name;
    });
    return picks.length === 1
      ? `${label}: ${parts[0]}`
      : `${label}\n${parts.join(", ")}`;
  }

  // Optional-feature / feat selections (Fighting Style, Eldritch Invocations, etc.)
  const selectionLines = picks.map((pick) => {
    const desc = descMap.get(pick.id) ?? [];
    // Truncate description to first two lines to keep the PDF compact.
    const shortDesc = desc.slice(0, 2).join(" ").trim();
    return shortDesc ? `${pick.name}: ${shortDesc}` : pick.name;
  });

  return picks.length === 1
    ? `${label}: ${selectionLines[0]}`
    : `${label}\n${selectionLines.join("\n")}`;
}

export function getClassFeaturesExport(
  classData: Class | null,
  subclassData: Subclass | null,
  level: number,
  optionalFeatureSelections?: BuilderOptionalFeatureSelections,
  descMap?: OptionalFeatureDescMap,
): { line1: string; line2: string } {
  const entries: string[] = [];

  const allProgressions: OptionalFeatureProgression[] = [
    ...(classData?.optionalFeatureProgressions ?? []),
    ...(subclassData?.optionalFeatureProgressions ?? []),
  ];

  // Names of class/subclass features that will be replaced by selection entries.
  const handledNames = buildProgressionHandledNames(allProgressions);

  // Collect standard (non-optional-catalog) class features.
  if (classData) {
    for (let i = 0; i < level; i++) {
      const row = classData.progression[i];
      if (!row) continue;
      for (const feature of row.features) {
        if (feature.isSubclassFeature || feature.gainSubclassFeature) continue;
        const name = feature.displayName || feature.name;
        if (isOmittedFeature(name)) continue;
        if (handledNames.has(name.toLowerCase())) continue;
        entries.push(formatFeatureEntry(name, feature.description));
      }
    }
  }

  // Collect standard subclass features.
  if (subclassData) {
    for (let i = 0; i < level; i++) {
      const row = subclassData.progression[i];
      if (!row) continue;
      for (const feature of row.features) {
        const name = feature.displayName || feature.name;
        if (isOmittedFeature(name)) continue;
        if (handledNames.has(name.toLowerCase())) continue;
        entries.push(formatFeatureEntry(name, feature.description));
      }
    }
  }

  // Append user's optional-feature selections (Fighting Style, Invocations, etc.)
  if (optionalFeatureSelections && descMap) {
    for (const progression of allProgressions) {
      const count = getOptionalFeatureCountAtLevel(progression.progression, level);
      if (count === 0) continue;

      const line = formatProgressionSelections(
        progression,
        optionalFeatureSelections,
        descMap,
      );
      if (line) entries.push(line);
    }
  }

  if (entries.length === 0) {
    return { line1: classData?.name ?? "", line2: "" };
  }

  const combined = entries.join("\n\n");

  if (combined.length <= FIELD_CHAR_CAPACITY) {
    return { line1: combined, line2: "" };
  }

  // Prefer splitting at a feature boundary (double newline) near the capacity limit.
  const searchFrom = Math.max(0, FIELD_CHAR_CAPACITY - 300);
  const featureBoundary = combined.indexOf("\n\n", searchFrom);
  if (featureBoundary !== -1 && featureBoundary <= FIELD_CHAR_CAPACITY + 300) {
    return {
      line1: combined.slice(0, featureBoundary).trim(),
      line2: combined.slice(featureBoundary).trim(),
    };
  }

  // A single feature is longer than the field: cascade at the nearest word boundary.
  let splitIdx = FIELD_CHAR_CAPACITY;
  while (splitIdx > 0 && combined[splitIdx] !== " " && combined[splitIdx] !== "\n") {
    splitIdx--;
  }
  if (splitIdx <= 0) splitIdx = FIELD_CHAR_CAPACITY;

  return {
    line1: combined.slice(0, splitIdx).trim(),
    line2: combined.slice(splitIdx).trim(),
  };
}

export function getSpeciesTraitsExport(speciesData: Species | null): string {
  if (!speciesData?.traits.length) return speciesData?.name ?? "";
  return speciesData.traits
    .map((trait) => formatFeatureEntry(trait.name, trait.entries))
    .join("\n\n");
}
