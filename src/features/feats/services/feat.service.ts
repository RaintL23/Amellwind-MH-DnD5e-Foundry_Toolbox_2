import { Feat } from "@/shared/types";
import { getFeatsRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapFeat } from "../mappers/feat.mapper";

const AGMH_SOURCES = new Set(["AGMH"]);

const service = createEntityService<unknown, Feat>({
  loadRaw: async () => {
    const rawData = (await getFeatsRaw()) as unknown[];
    return rawData.filter((raw) => {
      const source = String((raw as Record<string, unknown>).source ?? "");
      return AGMH_SOURCES.has(source);
    });
  },
  map: (raw) => mapFeat(raw),
  idOf: (feat) => feat.id,
});

export const getAllFeats = service.getAll;
export const getFeatById = service.getById;
export const clearFeatCache = service.clearCache;
