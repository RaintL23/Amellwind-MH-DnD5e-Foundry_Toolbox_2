import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  Class,
  DndFeat,
  DndOptionalFeature,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";
import { parseEntriesProficiencyGrants } from "@/shared/utils/text-proficiency-grants.parser";
import { statBlockContentToPlainText } from "@/shared/utils/statblock-entries.mapper";
import { getFeaturesUpToLevel } from "./builder-class.utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeatureChoiceGrants {
  armorGrants?: NamedProficiencyGrant[];
  weaponGrants?: NamedProficiencyGrant[];
  toolGrants?: NamedProficiencyGrant[];
  /** Extra cantrips granted by this option. */
  cantripBonus?: number;
}

export interface AggregatedFeatureChoiceGrants {
  armorGrants: NamedProficiencyGrant[];
  weaponGrants: NamedProficiencyGrant[];
  toolGrants: NamedProficiencyGrant[];
  cantripBonus: number;
}

// ─── Patterns ────────────────────────────────────────────────────────────────

/**
 * Cantrip bonus: "one extra cantrip", "one additional cantrip",
 * "know one more cantrip", "one extra cantrip from", etc.
 */
const CANTRIP_BONUS_RE =
  /\b(?:one\s+)?(?:extra|additional|more)\s+cantrip\b|\bcantrip\b.{0,50}\b(?:extra|additional|more)\b/i;

// ─── Parser ──────────────────────────────────────────────────────────────────

function normalizeSelectionName(value: string): string {
  return value.trim().toLowerCase();
}

function detectGrantsFromEntries(
  entries: string[],
  sourceName: string,
): FeatureChoiceGrants {
  const grants: FeatureChoiceGrants = {};
  const source = { type: "class" as const, name: sourceName };
  const parsed = parseEntriesProficiencyGrants(entries, source);

  if (parsed.armorGrants.length) grants.armorGrants = parsed.armorGrants;
  if (parsed.weaponGrants.length) grants.weaponGrants = parsed.weaponGrants;
  if (parsed.toolGrants.length) grants.toolGrants = parsed.toolGrants;

  if (CANTRIP_BONUS_RE.test(entries.join(" "))) {
    grants.cantripBonus = 1;
  }

  return grants;
}

function mergeGrants(
  target: AggregatedFeatureChoiceGrants,
  grants: FeatureChoiceGrants,
): void {
  if (grants.armorGrants?.length) target.armorGrants.push(...grants.armorGrants);
  if (grants.weaponGrants?.length) target.weaponGrants.push(...grants.weaponGrants);
  if (grants.toolGrants?.length) target.toolGrants.push(...grants.toolGrants);
  if (grants.cantripBonus) target.cantripBonus += grants.cantripBonus;
}

function resolveFeatureChoiceEntries(
  pick: BuilderOptionalFeatureSelection,
  progression: OptionalFeatureProgression,
): string[] {
  const option = progression.choiceOptions?.find(
    (candidate) =>
      candidate.id === pick.id ||
      normalizeSelectionName(candidate.name) === normalizeSelectionName(pick.name),
  );
  return option?.entries ?? [];
}

function resolveOptionalFeatureEntries(
  pick: BuilderOptionalFeatureSelection,
  catalog: DndOptionalFeature[],
): string[] {
  const feature = catalog.find(
    (candidate) =>
      candidate.id === pick.id ||
      (normalizeSelectionName(candidate.name) === normalizeSelectionName(pick.name) &&
        normalizeSelectionName(candidate.source) === normalizeSelectionName(pick.source)),
  );
  return feature?.entries ?? [];
}

function resolveFeatEntries(
  pick: BuilderOptionalFeatureSelection,
  catalog: DndFeat[],
): string[] {
  const feat = catalog.find(
    (candidate) =>
      candidate.id === pick.id ||
      normalizeSelectionName(candidate.name) === normalizeSelectionName(pick.name),
  );
  return feat?.paragraphs ?? [];
}

function resolveSelectionEntries(
  pick: BuilderOptionalFeatureSelection,
  progression: OptionalFeatureProgression,
  optionalCatalog: DndOptionalFeature[],
  featCatalog: DndFeat[],
): string[] {
  if (progression.catalog === "feature-choice") {
    return resolveFeatureChoiceEntries(pick, progression);
  }
  if (progression.catalog === "feat") {
    return resolveFeatEntries(pick, featCatalog);
  }
  return resolveOptionalFeatureEntries(pick, optionalCatalog);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Aggregates armor/weapon/tool grants from selected optional features by parsing
 * plain-text entries for proficiency language ("you gain proficiency with …").
 */
export function computeFeatureChoiceGrants(
  optionalFeatureSelections: BuilderOptionalFeatureSelections,
  progressions: OptionalFeatureProgression[],
  optionalCatalog: DndOptionalFeature[] = [],
  featCatalog: DndFeat[] = [],
): AggregatedFeatureChoiceGrants {
  const result: AggregatedFeatureChoiceGrants = {
    armorGrants: [],
    weaponGrants: [],
    toolGrants: [],
    cantripBonus: 0,
  };

  for (const progression of progressions) {
    const picks = optionalFeatureSelections[progression.id] ?? [];

    for (const pick of picks) {
      if (!pick) continue;

      const entries = resolveSelectionEntries(
        pick,
        progression,
        optionalCatalog,
        featCatalog,
      );
      if (!entries.length) continue;

      const sourceName = `${progression.name}: ${pick.name}`;
      mergeGrants(result, detectGrantsFromEntries(entries, sourceName));
    }
  }

  return result;
}

function emptyAggregatedGrants(): AggregatedFeatureChoiceGrants {
  return {
    armorGrants: [],
    weaponGrants: [],
    toolGrants: [],
    cantripBonus: 0,
  };
}

/**
 * Parses fixed proficiencies from class/subclass features granted by level
 * (excluding feature-choice parents and optional-feature catalog hosts).
 */
export function computeGrantedFeatureEquipmentGrants(
  classData: Class | null,
  subclass: Subclass | null,
  level: number,
  progressions: OptionalFeatureProgression[],
): AggregatedFeatureChoiceGrants {
  if (!classData) return emptyAggregatedGrants();

  const featureChoiceNames = new Set(
    progressions
      .filter((progression) => progression.catalog === "feature-choice")
      .map((progression) => progression.name.trim().toLowerCase()),
  );

  const result = emptyAggregatedGrants();
  const features = getFeaturesUpToLevel(classData, subclass, level);

  for (const feature of features) {
    const featureName = feature.name.trim().toLowerCase();
    if (featureChoiceNames.has(featureName)) continue;
    if (/ options$/i.test(feature.name)) continue;
    if ((feature.optionalFeatureRefs?.length ?? 0) > 0) continue;
    if ((feature.featRefs?.length ?? 0) > 0) continue;

    const entries = [
      ...feature.description,
      ...feature.content
        .map(statBlockContentToPlainText)
        .map((line) => line.trim())
        .filter(Boolean),
    ];
    if (!entries.length) continue;

    const sourceName = feature.isSubclassFeature
      ? `${subclass?.name ?? "Subclass"}: ${feature.name}`
      : `${classData.name}: ${feature.name}`;
    mergeGrants(result, detectGrantsFromEntries(entries, sourceName));
  }

  return result;
}

export function computeAllClassEquipmentGrants(
  optionalFeatureSelections: BuilderOptionalFeatureSelections,
  progressions: OptionalFeatureProgression[],
  classData: Class | null,
  subclass: Subclass | null,
  level: number,
  optionalCatalog: DndOptionalFeature[] = [],
  featCatalog: DndFeat[] = [],
): AggregatedFeatureChoiceGrants {
  const selectionGrants = computeFeatureChoiceGrants(
    optionalFeatureSelections,
    progressions,
    optionalCatalog,
    featCatalog,
  );
  const grantedFeatureGrants = computeGrantedFeatureEquipmentGrants(
    classData,
    subclass,
    level,
    progressions,
  );

  return {
    armorGrants: [
      ...selectionGrants.armorGrants,
      ...grantedFeatureGrants.armorGrants,
    ],
    weaponGrants: [
      ...selectionGrants.weaponGrants,
      ...grantedFeatureGrants.weaponGrants,
    ],
    toolGrants: [...selectionGrants.toolGrants, ...grantedFeatureGrants.toolGrants],
    cantripBonus: selectionGrants.cantripBonus + grantedFeatureGrants.cantripBonus,
  };
}
