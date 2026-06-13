import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  BuilderOptionalFeatureSlot,
  Class,
  DndFeat,
  DndOptionalFeature,
  DndOptionalFeatureRef,
  FeatureChoiceOption,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import {
  getOptionalFeatureCountAtLevel,
  isFightingStyleProgression,
  optionalFeatureRefKey,
  parseOptionalFeatureRef,
} from "@/features/classes/utils/optional-feature-progression.utils";
import { classId } from "@/features/classes/mappers/class.mapper";
import { getFeaturesUpToLevel } from "./builder-class.utils";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types";

export interface ResolvedOptionalFeatureProgression {
  progression: OptionalFeatureProgression;
  slotCount: number;
}

export function toOptionalFeatureSlot(
  progressionId: string,
): BuilderOptionalFeatureSlot {
  return `opt-${progressionId}`;
}

export function isOptionalFeatureSlot(
  slot: string | null,
): slot is BuilderOptionalFeatureSlot {
  return typeof slot === "string" && slot.startsWith("opt-");
}

export function parseOptionalFeatureSlot(
  slot: BuilderOptionalFeatureSlot,
): { progressionId: string } | null {
  if (!slot.startsWith("opt-")) return null;
  const progressionId = slot.slice(4);
  return progressionId ? { progressionId } : null;
}

export function progressionDisplayName(name: string): string {
  return name.replace(/ Options$/i, "").trim();
}

export function getProgressionPicks(
  selections: BuilderOptionalFeatureSelections,
  progressionId: string,
): BuilderOptionalFeatureSelection[] {
  return (selections[progressionId] ?? []).filter(
    (s): s is BuilderOptionalFeatureSelection => s !== null,
  );
}

export function resolveOptionalFeatureProgressions(
  classData: Class | null,
  subclass: Subclass | null,
  level: number,
): ResolvedOptionalFeatureProgression[] {
  const results: ResolvedOptionalFeatureProgression[] = [];

  for (const progression of classData?.optionalFeatureProgressions ?? []) {
    const slotCount = getOptionalFeatureCountAtLevel(
      progression.progression,
      level,
    );
    if (slotCount > 0) {
      results.push({ progression, slotCount });
    }
  }

  if (subclass) {
    for (const progression of subclass.optionalFeatureProgressions ?? []) {
      const slotCount = getOptionalFeatureCountAtLevel(
        progression.progression,
        level,
      );
      if (slotCount > 0) {
        results.push({ progression, slotCount });
      }
    }
  }

  return results;
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

function normalizePickName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getOtherFightingStylePicks(
  selections: BuilderOptionalFeatureSelections,
  progressions: ResolvedOptionalFeatureProgression[],
  currentProgressionId: string,
): BuilderOptionalFeatureSelection[] {
  const fsIds = new Set(
    progressions
      .filter((p) => isFightingStyleProgression(p.progression))
      .map((p) => p.progression.id),
  );

  const picks: BuilderOptionalFeatureSelection[] = [];
  for (const [id, list] of Object.entries(selections)) {
    if (id === currentProgressionId || !fsIds.has(id)) continue;
    picks.push(...(list ?? []).filter((s): s is BuilderOptionalFeatureSelection => s !== null));
  }
  return picks;
}

export function isFightingStyleNameTaken(
  name: string,
  otherPicks: BuilderOptionalFeatureSelection[],
): boolean {
  const target = normalizePickName(name);
  return otherPicks.some((p) => normalizePickName(p.name) === target);
}

export function dndFeatToSelection(
  feat: DndFeat,
  progressionId: string,
): BuilderOptionalFeatureSelection {
  return {
    id: feat.id,
    name: feat.name,
    source: feat.source,
    progressionId,
    featureTypes: feat.category ? [feat.category] : [],
  };
}

export function isFeatureChoiceProgression(
  progression: OptionalFeatureProgression,
): boolean {
  return progression.catalog === "feature-choice";
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

export function featureChoiceToSelection(
  option: FeatureChoiceOption,
  progressionId: string,
): BuilderOptionalFeatureSelection {
  return {
    id: option.id,
    name: option.name,
    source: option.source,
    progressionId,
    featureTypes: [],
  };
}

export function getAutoGrantSelections(
  progression: OptionalFeatureProgression,
): BuilderOptionalFeatureSelection[] {
  if (progression.catalog !== "feature-choice" || progression.pickMode !== "all") {
    return [];
  }
  return (progression.choiceOptions ?? []).map((opt) =>
    featureChoiceToSelection(opt, progression.id),
  );
}

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

export function getFeatCategoryLabel(category?: string): string | undefined {
  if (!category) return undefined;
  return DND_FEAT_CATEGORY_LABELS[category] ?? category;
}

export { isFightingStyleProgression };

export function dndOptionalFeatureToSelection(
  feature: DndOptionalFeature,
  progressionId: string,
): BuilderOptionalFeatureSelection {
  return {
    id: feature.id,
    name: feature.name,
    source: feature.source,
    progressionId,
    featureTypes: feature.featureType,
  };
}

export function getProgressionOwnerLabel(
  progression: OptionalFeatureProgression,
  classData: Class | null,
  subclass: Subclass | null,
): string {
  if (progression.scope === "subclass" && subclass) {
    return subclass.name;
  }
  return classData?.name ?? "Class";
}

export function refToFeatureId(ref: DndOptionalFeatureRef): string {
  return classId(ref.name, ref.source);
}

export { parseOptionalFeatureRef, optionalFeatureRefKey };
