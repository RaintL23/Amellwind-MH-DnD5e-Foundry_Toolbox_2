import type { MhCondition } from "@/shared/types";
import { getConditionsRaw } from "@/shared/db/sync.service";
import { mapCondition } from "../mappers/condition.mapper";

let cache: MhCondition[] | null = null;

export async function getAllConditions(): Promise<MhCondition[]> {
  if (cache) return cache;
  const rawData = await getConditionsRaw();
  cache = (rawData as unknown[]).map((raw) => mapCondition(raw));
  return cache;
}

export async function getConditionById(
  id: string,
): Promise<MhCondition | undefined> {
  const all = await getAllConditions();
  return all.find((condition) => condition.id === id);
}

export function clearConditionCache(): void {
  cache = null;
}
