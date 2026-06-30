import { Background } from "@/shared/types";
import { getBackgroundsRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapBackground } from "../mappers/background.mapper";

const service = createEntityService<unknown, Background>({
  loadRaw: async () => (await getBackgroundsRaw()) as unknown[],
  map: (raw) => mapBackground(raw),
  idOf: (background) => background.id,
});

export const getAllBackgrounds = service.getAll;
export const getBackgroundById = service.getById;
export const clearBackgroundCache = service.clearCache;
