import type { DndOptionalFeature } from "@/shared/types";
import { OPTIONALFEATURES_JSON_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapDndOptionalFeature } from "../mappers/dnd-optionalfeature.mapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

let byTypeIndex: Map<string, DndOptionalFeature[]> | null = null;

const service = createEntityService<Raw, DndOptionalFeature>({
  loadRaw: async () => {
    const data = await fetchFiveToolsJson<{ optionalfeature?: Raw[] }>(
      OPTIONALFEATURES_JSON_URL,
      "optionalfeatures.json",
    );
    const rawList = Array.isArray(data.optionalfeature)
      ? data.optionalfeature
      : [];
    return rawList.filter((raw) => raw.name && raw.featureType?.length);
  },
  map: (raw) => mapDndOptionalFeature(raw),
  idOf: (feat) => feat.id,
});

function buildByTypeIndex(
  all: DndOptionalFeature[],
): Map<string, DndOptionalFeature[]> {
  const byType = new Map<string, DndOptionalFeature[]>();
  for (const feat of all) {
    for (const type of feat.featureType) {
      const key = type.toUpperCase();
      const group = byType.get(key) ?? [];
      group.push(feat);
      byType.set(key, group);
    }
  }
  for (const [key, group] of byType) {
    group.sort(
      (a, b) => (a.page ?? 0) - (b.page ?? 0) || a.name.localeCompare(b.name),
    );
    byType.set(key, group);
  }
  return byType;
}

export const getAllDndOptionalFeatures = service.getAll;
export const getDndOptionalFeatureById = service.getById;

export async function getDndOptionalFeaturesByType(
  featureType: string,
): Promise<DndOptionalFeature[]> {
  const all = await service.getAll();
  if (!byTypeIndex) byTypeIndex = buildByTypeIndex(all);
  return byTypeIndex.get(featureType.toUpperCase()) ?? [];
}

export function clearDndOptionalFeaturesCache(): void {
  service.clearCache();
  byTypeIndex = null;
}
