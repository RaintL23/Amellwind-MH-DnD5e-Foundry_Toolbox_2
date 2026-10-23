import type { DndFeat, DndOptionalFeature } from "@/shared/types";
import type { BuilderOptionalFeatureSelection } from "@/shared/types";
import { isFightingStyleProgression } from "@/features/dnd/classes/utils/optional-feature-progression.utils";
import { type OptionalFeatureCatalogItem } from "@/features/dnd/classes/utils/optional-feature-catalog.utils";
import { type ResolvedOptionalFeatureProgression } from "@/features/raintdm/builder/utils/class-optional-features.utils";
import {
  isFightingStyleFeatAvailable,
  isOptionalFeatureAvailable,
} from "@/features/raintdm/builder/utils/optional-feature-prerequisites.utils";

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isOptionalFeaturePicked(
  item: OptionalFeatureCatalogItem,
  picked: BuilderOptionalFeatureSelection[],
): boolean {
  return picked.some(
    (p) => normalizeName(p.name) === normalizeName(item.name),
  );
}

export function countOptionalFeaturePicks(
  item: OptionalFeatureCatalogItem,
  picked: BuilderOptionalFeatureSelection[],
): number {
  const target = normalizeName(item.name);
  return picked.filter((p) => normalizeName(p.name) === target).length;
}

/**
 * Drops every copy of a non-repeatable pick, but only the last copy of a
 * repeatable one (e.g. a second Lessons of the First Ones).
 */
export function removeOptionalFeaturePick(
  item: OptionalFeatureCatalogItem,
  picked: BuilderOptionalFeatureSelection[],
): BuilderOptionalFeatureSelection[] {
  const target = normalizeName(item.name);
  if (!item.isRepeatable) {
    return picked.filter((p) => normalizeName(p.name) !== target);
  }
  for (let i = picked.length - 1; i >= 0; i--) {
    if (normalizeName(picked[i].name) === target) {
      return picked.filter((_, index) => index !== i);
    }
  }
  return picked;
}

export function canAddOptionalFeature(
  item: OptionalFeatureCatalogItem,
  options: {
    isGrantAllFeatureChoice: boolean;
    isPicked: boolean;
    atCapacity: boolean;
    optionalCatalog: DndOptionalFeature[];
    otherFightingStylePicks: BuilderOptionalFeatureSelection[];
    activeProgression: ResolvedOptionalFeatureProgression;
    className: string;
    level: number;
    picked: BuilderOptionalFeatureSelection[];
    progressionId: string;
  },
): boolean {
  const {
    isGrantAllFeatureChoice,
    isPicked,
    atCapacity,
    optionalCatalog,
    otherFightingStylePicks,
    activeProgression,
    className,
    level,
    picked,
    progressionId,
  } = options;

  if (isGrantAllFeatureChoice) return false;
  // Picked rows stay clickable (to remove); repeatable ones may still add a copy.
  if (isPicked && !item.isRepeatable) return true;
  if (atCapacity) return false;

  if (item.catalog === "feature-choice") {
    return true;
  }

  if (item.catalog === "feat") {
    return isFightingStyleFeatAvailable(
      { name: item.name } as DndFeat,
      otherFightingStylePicks,
    );
  }

  const feature = optionalCatalog.find((f) => f.id === item.id);
  if (!feature) return false;

  if (
    isFightingStyleProgression(activeProgression.progression) &&
    otherFightingStylePicks.some(
      (p) => normalizeName(p.name) === normalizeName(item.name),
    )
  ) {
    return false;
  }

  return isOptionalFeatureAvailable(feature, {
    className,
    classLevel: level,
    selectedFeatures: picked,
    progressionId,
  });
}
