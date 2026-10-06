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
} from "@/features/dnd/classes/utils/optional-feature-progression.utils";
import { classId } from "@/features/dnd/classes/mappers/class.mapper";

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
