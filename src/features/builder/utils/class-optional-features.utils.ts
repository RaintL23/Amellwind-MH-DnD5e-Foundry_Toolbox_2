import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  BuilderOptionalFeatureSlot,
  Class,
  DndOptionalFeature,
  DndOptionalFeatureRef,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import {
  getOptionalFeatureCountAtLevel,
  optionalFeatureRefKey,
  parseOptionalFeatureRef,
} from "@/features/classes/utils/optional-feature-progression.utils";
import { classId } from "@/features/classes/mappers/class.mapper";
import { getFeaturesUpToLevel } from "./builder-class.utils";

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
): DndOptionalFeatureRef[] {
  const features = getFeaturesUpToLevel(classData, subclass, level);
  const refs: DndOptionalFeatureRef[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    for (const ref of feature.optionalFeatureRefs ?? []) {
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
