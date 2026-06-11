import type {
  BuilderOptionalFeatureSelection,
  DndOptionalFeature,
} from "@/shared/types";

export interface OptionalFeaturePrerequisiteContext {
  className: string;
  classLevel: number;
  selectedFeatures: BuilderOptionalFeatureSelection[];
  progressionId: string;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasSelectedFeature(
  selected: BuilderOptionalFeatureSelection[],
  featureName: string,
): boolean {
  const target = normalizeName(featureName);
  return selected.some((s) => normalizeName(s.name) === target);
}

export function isOptionalFeatureAvailable(
  feature: DndOptionalFeature,
  ctx: OptionalFeaturePrerequisiteContext,
): boolean {
  for (const prereq of feature.prerequisites) {
    if (prereq.kind === "level") {
      if (
        prereq.minClassLevel !== undefined &&
        ctx.classLevel < prereq.minClassLevel
      ) {
        return false;
      }
    }

    if (prereq.kind === "feature" && prereq.requiredFeatures?.length) {
      const missing = prereq.requiredFeatures.some(
        (name) => !hasSelectedFeature(ctx.selectedFeatures, name),
      );
      if (missing) return false;
    }

    if (prereq.kind === "pact" && prereq.pactName) {
      const pactNorm = normalizeName(prereq.pactName);
      const hasPact = ctx.selectedFeatures.some((s) => {
        const n = normalizeName(s.name);
        return n.includes("pact") && n.includes(pactNorm.replace("pactof", ""));
      });
      if (!hasPact) return false;
    }
  }

  return true;
}

export function isAlreadySelected(
  feature: DndOptionalFeature,
  selected: BuilderOptionalFeatureSelection[],
): boolean {
  return selected.some(
    (s) => normalizeName(s.name) === normalizeName(feature.name),
  );
}

export function filterAvailableOptionalFeatures(
  catalog: DndOptionalFeature[],
  ctx: OptionalFeaturePrerequisiteContext,
): DndOptionalFeature[] {
  return catalog.filter((feature) => {
    if (isAlreadySelected(feature, ctx.selectedFeatures)) return false;
    return isOptionalFeatureAvailable(feature, ctx);
  });
}

export function getPrerequisiteSummary(feature: DndOptionalFeature): string {
  if (feature.prerequisites.length === 0) return "";
  return feature.prerequisites.map((p) => p.summary).join(" · ");
}
