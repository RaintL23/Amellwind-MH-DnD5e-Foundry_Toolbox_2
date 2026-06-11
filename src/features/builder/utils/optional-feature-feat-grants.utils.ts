import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  DndOptionalFeature,
} from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { formatInvocationOriginFeatSourceName } from "./origin-feat.constants";

export interface OptionalFeatureOriginFeatSlot {
  slotIndex: number;
  grant: Extract<OriginFeatGrant, { kind: "choose" }>;
  sourceFeatureId: string;
  sourceFeatureName: string;
  /** 0-based duplicate index when the same invocation is picked multiple times. */
  duplicateIndex: number;
}

export function resolveOptionalFeatureOriginFeatSlots(
  catalog: DndOptionalFeature[],
  selections: BuilderOptionalFeatureSelections,
): OptionalFeatureOriginFeatSlot[] {
  const flatSelections = Object.values(selections)
    .flat()
    .filter((s): s is BuilderOptionalFeatureSelection => s !== null);

  const countByFeatureId = new Map<string, number>();
  for (const sel of flatSelections) {
    countByFeatureId.set(sel.id, (countByFeatureId.get(sel.id) ?? 0) + 1);
  }

  const featureById = new Map(catalog.map((f) => [f.id, f]));
  const slots: OptionalFeatureOriginFeatSlot[] = [];
  let slotIndex = 0;

  for (const [featureId, pickCount] of countByFeatureId) {
    const feature = featureById.get(featureId);
    if (!feature?.featProgression?.length) continue;

    for (const progression of feature.featProgression) {
      if (!progression.categories.includes("O")) continue;

      const totalSlots = pickCount * progression.countPerSelection;
      for (let duplicateIndex = 0; duplicateIndex < totalSlots; duplicateIndex++) {
        slots.push({
          slotIndex: slotIndex++,
          grant: {
            kind: "choose",
            categories: progression.categories,
            count: 1,
            summary: progression.name || "Origin Feat of your choice",
          },
          sourceFeatureId: featureId,
          sourceFeatureName: feature.name,
          duplicateIndex,
        });
      }
    }
  }

  return slots;
}

export function optionalFeatureOriginFeatSourceName(
  slot: OptionalFeatureOriginFeatSlot,
): string {
  return formatInvocationOriginFeatSourceName(
    slot.sourceFeatureName,
    slot.duplicateIndex,
  );
}
