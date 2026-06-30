import type { MaterialEffect } from "@/shared/types";
import { getBookDataRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapMaterialEffectsFromBookData } from "../mappers/material-effect.mapper";
import {
  buildMaterialEffectNameIndex,
  type MaterialEffectNameIndex,
} from "../utils/material-effect-highlight.utils";

export type { MaterialEffectNameIndex };

let nameIndexCache: MaterialEffectNameIndex | null = null;

const service = createEntityService<MaterialEffect, MaterialEffect>({
  loadRaw: async () => mapMaterialEffectsFromBookData(await getBookDataRaw()),
  map: (effect) => effect,
});

export const getAllMaterialEffects = service.getAll;

export async function getMaterialEffectNameIndex(): Promise<MaterialEffectNameIndex> {
  if (nameIndexCache) return nameIndexCache;
  const effects = await service.getAll();
  nameIndexCache = buildMaterialEffectNameIndex(effects);
  return nameIndexCache;
}

export function clearMaterialEffectCache(): void {
  service.clearCache();
  nameIndexCache = null;
}
