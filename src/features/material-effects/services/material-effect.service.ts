import type { MaterialEffect } from "@/shared/types";
import { getBookDataRaw } from "@/shared/db/sync.service";
import { mapMaterialEffectsFromBookData } from "../mappers/material-effect.mapper";
import {
  buildMaterialEffectNameIndex,
  type MaterialEffectNameIndex,
} from "../utils/material-effect-highlight.utils";

let cache: MaterialEffect[] | null = null;
let nameIndexCache: MaterialEffectNameIndex | null = null;

export type { MaterialEffectNameIndex };

export async function getAllMaterialEffects(): Promise<MaterialEffect[]> {
  if (cache) return cache;
  const bookData = await getBookDataRaw();
  cache = mapMaterialEffectsFromBookData(bookData);
  return cache;
}

export async function getMaterialEffectNameIndex(): Promise<MaterialEffectNameIndex> {
  if (nameIndexCache) return nameIndexCache;
  const effects = await getAllMaterialEffects();
  nameIndexCache = buildMaterialEffectNameIndex(effects);
  return nameIndexCache;
}

export function clearMaterialEffectCache(): void {
  cache = null;
  nameIndexCache = null;
}
