import type { MhDisease } from "@/shared/types";
import { getDiseasesRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapDisease } from "../mappers/disease.mapper";

const service = createEntityService<unknown, MhDisease>({
  loadRaw: async () => (await getDiseasesRaw()) as unknown[],
  map: (raw) => mapDisease(raw),
  idOf: (disease) => disease.id,
});

export const getAllDiseases = service.getAll;
export const getDiseaseById = service.getById;
export const clearDiseaseCache = service.clearCache;
