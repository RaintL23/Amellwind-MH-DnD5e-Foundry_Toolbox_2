import type { DndOptionalFeature } from "@/shared/types";
import { OPTIONALFEATURES_JSON_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { mapDndOptionalFeature } from "../mappers/dnd-optionalfeature.mapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

let cache: DndOptionalFeature[] | null = null;
let byIdIndex: Map<string, DndOptionalFeature> | null = null;
let byTypeIndex: Map<string, DndOptionalFeature[]> | null = null;

function buildIndexes(all: DndOptionalFeature[]): void {
  byIdIndex = new Map(all.map((f) => [f.id, f]));
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
      (a, b) =>
        (a.page ?? 0) - (b.page ?? 0) || a.name.localeCompare(b.name),
    );
    byType.set(key, group);
  }

  byTypeIndex = byType;
}

export async function getAllDndOptionalFeatures(): Promise<DndOptionalFeature[]> {
  if (cache) return cache;

  const data = await fetchFiveToolsJson<{ optionalfeature?: Raw[] }>(
    OPTIONALFEATURES_JSON_URL,
    "optionalfeatures.json",
  );

  const rawList = Array.isArray(data.optionalfeature)
    ? data.optionalfeature
    : [];

  cache = rawList
    .filter((raw) => raw.name && raw.featureType?.length)
    .map((raw) => mapDndOptionalFeature(raw));

  buildIndexes(cache);
  return cache;
}

export async function getDndOptionalFeatureById(
  id: string,
): Promise<DndOptionalFeature | undefined> {
  await getAllDndOptionalFeatures();
  return byIdIndex?.get(id);
}

export async function getDndOptionalFeaturesByType(
  featureType: string,
): Promise<DndOptionalFeature[]> {
  await getAllDndOptionalFeatures();
  return byTypeIndex?.get(featureType.toUpperCase()) ?? [];
}

export function clearDndOptionalFeaturesCache(): void {
  cache = null;
  byIdIndex = null;
  byTypeIndex = null;
}
