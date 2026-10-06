/**
 * Optional-feature catalogs for class progressions (Fighting Styles,
 * Invocations, Metamagic, Weapon Mastery, feat pools, feature choices).
 * Shared by the class compendium and the Builder library.
 */
import type {
  Class,
  DndFeat,
  DndOptionalFeature,
  DndOptionalFeatureRef,
  FeatureChoiceOption,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types";
import { getFeaturesUpToLevel } from "./class-features-at-level.utils";
import { optionalFeatureRefKey } from "./optional-feature-progression.utils";

export interface OptionalFeatureCatalogItem {
  id: string;
  name: string;
  source: string;
  page?: number;
  catalog: "optionalfeature" | "feat" | "feature-choice";
  entries: string[];
  featureTypes: string[];
  category?: string;
  consumes?: string;
  isRepeatable?: boolean;
  prerequisiteSummary?: string;
}

export function progressionDisplayName(name: string): string {
  return name.replace(/ Options$/i, "").trim();
}

function featureHostsOptionalCatalog(feature: {
  name: string;
  optionalFeatureRefs?: DndOptionalFeatureRef[];
  featRefs?: DndOptionalFeatureRef[];
}): boolean {
  if (/ options$/i.test(feature.name)) return true;
  if ((feature.optionalFeatureRefs?.length ?? 0) > 0) return true;
  if ((feature.featRefs?.length ?? 0) > 0) return true;
  return false;
}

export function collectOptionPoolRefs(
  classData: Class,
  subclass: Subclass | null,
  level: number,
  catalog: OptionalFeatureProgression["catalog"] = "optionalfeature",
): DndOptionalFeatureRef[] {
  const features = getFeaturesUpToLevel(classData, subclass, level);
  const refs: DndOptionalFeatureRef[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    if (!featureHostsOptionalCatalog(feature)) continue;

    const sourceRefs =
      catalog === "feat"
        ? (feature.featRefs ?? [])
        : (feature.optionalFeatureRefs ?? []);

    for (const ref of sourceRefs) {
      const key = optionalFeatureRefKey(ref);
      if (seen.has(key)) continue;
      seen.add(key);
      refs.push(ref);
    }
  }

  return refs;
}

export function filterCatalogForProgression(
  catalog: DndOptionalFeature[],
  poolRefs: DndOptionalFeatureRef[],
  featureTypes: string[],
): DndOptionalFeature[] {
  const typeSet = new Set(featureTypes.map((t) => t.toUpperCase()));
  const byType = catalog.filter((f) =>
    f.featureType.some((t) => typeSet.has(t.toUpperCase())),
  );

  if (poolRefs.length === 0) {
    return byType;
  }

  const poolKeys = new Set(poolRefs.map(optionalFeatureRefKey));
  const fromPool = byType.filter((f) =>
    poolKeys.has(optionalFeatureRefKey({ name: f.name, source: f.source })),
  );

  return fromPool.length > 0 ? fromPool : byType;
}

export function filterFeatsForProgression(
  catalog: DndFeat[],
  poolRefs: DndOptionalFeatureRef[],
  featCategories: string[],
): DndFeat[] {
  const catSet = new Set(featCategories.map((c) => c.toUpperCase()));
  const byCategory = catalog.filter(
    (f) => f.category && catSet.has(f.category.toUpperCase()),
  );

  const seen = new Set(byCategory.map((f) => f.id));
  for (const ref of poolRefs) {
    const match = catalog.find(
      (f) =>
        f.name.toLowerCase() === ref.name.toLowerCase() &&
        f.source.toLowerCase() === ref.source.toLowerCase(),
    );
    if (match && !seen.has(match.id)) {
      byCategory.push(match);
      seen.add(match.id);
    }
  }

  return byCategory.sort(
    (a, b) =>
      (a.page ?? 0) - (b.page ?? 0) || a.name.localeCompare(b.name),
  );
}

export function isFeatureChoiceProgression(
  progression: OptionalFeatureProgression,
): boolean {
  return progression.catalog === "feature-choice";
}

export function isWeaponMasteryProgression(
  progression: OptionalFeatureProgression,
): boolean {
  return (
    progression.name === "Weapon Mastery" ||
    progression.id.startsWith("wm-")
  );
}

export function featureChoiceToCatalogItem(
  option: FeatureChoiceOption,
): OptionalFeatureCatalogItem {
  return {
    id: option.id,
    name: option.name,
    source: option.source,
    catalog: "feature-choice",
    entries: option.entries,
    featureTypes: [],
  };
}

export function optionalFeatureToCatalogItem(
  feature: DndOptionalFeature,
  prerequisiteSummary?: string,
): OptionalFeatureCatalogItem {
  return {
    id: feature.id,
    name: feature.name,
    source: feature.source,
    page: feature.page,
    catalog: "optionalfeature",
    entries: feature.entries,
    featureTypes: feature.featureType,
    consumes: feature.consumes,
    isRepeatable: feature.isRepeatable,
    prerequisiteSummary,
  };
}

export function dndFeatToCatalogItem(
  feat: DndFeat,
  prerequisiteSummary?: string,
): OptionalFeatureCatalogItem {
  return {
    id: feat.id,
    name: feat.name,
    source: feat.source,
    page: feat.page,
    catalog: "feat",
    entries: feat.paragraphs,
    featureTypes: feat.category ? [feat.category] : [],
    category: feat.category,
    isRepeatable: feat.repeatable,
    prerequisiteSummary,
  };
}

export function getPrerequisiteSummary(feature: DndOptionalFeature): string {
  if (feature.prerequisites.length === 0) return "";
  return feature.prerequisites.map((p) => p.summary).join(" · ");
}

export function getFeatPrerequisiteSummary(feat: DndFeat): string {
  if (feat.prerequisites.length === 0) return "";
  return feat.prerequisites.join(" · ");
}

export function getFeatCategoryLabel(category?: string): string | undefined {
  if (!category) return undefined;
  return DND_FEAT_CATEGORY_LABELS[category] ?? category;
}
