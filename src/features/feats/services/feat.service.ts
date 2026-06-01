import { Feat } from "@/shared/types";
import { getFeatsRaw } from "@/shared/db/sync.service";
import { mapFeat } from "../mappers/feat.mapper";

const AGMH_SOURCES = new Set(["AGMH"]);

let cache: Feat[] | null = null;

export async function getAllFeats(): Promise<Feat[]> {
  if (cache) return cache;
  const rawData = await getFeatsRaw();
  cache = (rawData as unknown[])
    .filter((raw) => {
      const source = String((raw as Record<string, unknown>).source ?? "");
      return AGMH_SOURCES.has(source);
    })
    .map((raw) => mapFeat(raw));
  return cache;
}

export async function getFeatById(id: string): Promise<Feat | undefined> {
  const all = await getAllFeats();
  return all.find((f) => f.id === id);
}

export function clearFeatCache(): void {
  cache = null;
}
