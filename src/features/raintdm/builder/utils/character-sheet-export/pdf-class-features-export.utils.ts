import type {
  BuilderOptionalFeatureSelections,
  Class,
  OptionalFeatureProgression,
  Species,
  Subclass,
} from "@/shared/types";
import { getOptionalFeatureCountAtLevel } from "@/features/dnd/classes/utils/optional-feature-progression.utils";
import {
  resolveSpeciesTraitEntries,
  resolveTraitChoiceSelection,
} from "@/shared/utils/species-trait-choice.utils";
import { shouldOmitClassFeatureForChoices } from "@/features/raintdm/builder/utils/feature-choice-description.utils";
import type { ExportTextSection } from "./pdf-text-layout.utils";

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

function formatFeatureEntry(name: string, description: string[]): ExportTextSection {
  return { title: name, body: description.join("\n").trim() };
}

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
 * Formats the user's selections for a single progression into a PDF section.
 * Returns null when no selections are available.
 */
function formatProgressionSelections(
  progression: OptionalFeatureProgression,
  selections: BuilderOptionalFeatureSelections,
  descMap: OptionalFeatureDescMap,
): ExportTextSection | null {
  const picks = (selections[progression.id] ?? []).filter(
    (s): s is NonNullable<typeof s> => s !== null,
  );

  if (picks.length === 0) return null;

  const label = progressionLabel(progression.name);

  if (progression.catalog === "feature-choice") {
    // For feature-choice progressions (Weapon Mastery, patron sub-type, etc.)
    // build a compact list: "Label. Option1 (desc), Option2 (desc), ..."
    const optionMap = new Map(
      (progression.choiceOptions ?? []).map((o) => [o.id, o]),
    );
    const parts = picks.map((pick) => {
      const opt = optionMap.get(pick.id);
      const desc = opt?.entries[0] ?? "";
      return desc ? `${pick.name} (${desc})` : pick.name;
    });
    return { title: label, body: parts.join(", ") };
  }

  // Optional-feature / feat selections (Fighting Style, Eldritch Invocations, etc.)
  // Full descriptions: anything that does not fit goes to the continuation page.
  const describe = (id: string) => (descMap.get(id) ?? []).join(" ").trim();

  if (picks.length === 1) {
    return { title: `${label}: ${picks[0].name}`, body: describe(picks[0].id) };
  }
  const selectionLines = picks.map((pick) => {
    const desc = describe(pick.id);
    return desc ? `${pick.name}: ${desc}` : pick.name;
  });
  return { title: label, body: selectionLines.join("\n") };
}

export function getClassFeaturesExport(
  classData: Class | null,
  subclassData: Subclass | null,
  level: number,
  optionalFeatureSelections?: BuilderOptionalFeatureSelections,
  descMap?: OptionalFeatureDescMap,
): ExportTextSection[] {
  const entries: ExportTextSection[] = [];

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
        if (
          optionalFeatureSelections &&
          shouldOmitClassFeatureForChoices(
            name,
            allProgressions,
            optionalFeatureSelections,
          )
        ) {
          continue;
        }
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
        if (
          optionalFeatureSelections &&
          shouldOmitClassFeatureForChoices(
            name,
            allProgressions,
            optionalFeatureSelections,
          )
        ) {
          continue;
        }
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

  return entries;
}

export function getSpeciesTraitsExport(
  speciesData: Species | null,
  speciesTraitChoices: Record<string, string> = {},
): ExportTextSection[] {
  return (speciesData?.traits ?? []).map((trait) => {
    const selected = resolveTraitChoiceSelection(trait, speciesTraitChoices);
    const entries = resolveSpeciesTraitEntries(trait, selected, {
      showAllWhenUnselected: false,
    });
    return formatFeatureEntry(trait.name, entries);
  });
}
