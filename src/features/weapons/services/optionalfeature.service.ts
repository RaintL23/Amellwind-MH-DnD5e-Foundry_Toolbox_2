import { OptionalFeature } from "@/shared/types";
import { mapOptionalFeature } from "../mappers/optionalfeature.mapper";
import { getOptionalFeaturesRaw } from "@/shared/db/sync.service";

/** Keyed by lowercase feature name for O(1) lookup */
let cache: Map<string, OptionalFeature> | null = null;

export async function getOptionalFeaturesMap(): Promise<Map<string, OptionalFeature>> {
  if (cache) return cache;

  const raw = await getOptionalFeaturesRaw();
  cache = new Map();

  for (const item of raw) {
    const feature = mapOptionalFeature(item);
    if (feature.name) {
      cache.set(feature.name.toLowerCase(), feature);
    }
  }

  return cache;
}

export function clearOptionalFeaturesCache(): void {
  cache = null;
}
