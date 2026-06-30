import type { MhCondition } from "@/shared/types";
import { getConditionsRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapCondition } from "../mappers/condition.mapper";

const service = createEntityService<unknown, MhCondition>({
  loadRaw: async () => (await getConditionsRaw()) as unknown[],
  map: (raw) => mapCondition(raw),
  idOf: (condition) => condition.id,
});

export const getAllConditions = service.getAll;
export const getConditionById = service.getById;
export const clearConditionCache = service.clearCache;
