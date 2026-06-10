import type { MhDisease } from "@/shared/types";
import { getDiseasesRaw } from "@/shared/db/sync.service";
import { mapDisease } from "../mappers/disease.mapper";

let cache: MhDisease[] | null = null;

export async function getAllDiseases(): Promise<MhDisease[]> {
  if (cache) return cache;
  const rawData = await getDiseasesRaw();
  cache = (rawData as unknown[]).map((raw) => mapDisease(raw));
  return cache;
}

export async function getDiseaseById(
  id: string,
): Promise<MhDisease | undefined> {
  const all = await getAllDiseases();
  return all.find((disease) => disease.id === id);
}

export function clearDiseaseCache(): void {
  cache = null;
}
