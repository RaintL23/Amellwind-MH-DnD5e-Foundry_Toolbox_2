import type { DowntimeActivity } from "@/shared/types";
import { getVariantRulesRaw } from "@/shared/db/sync.service";
import { mapDowntimeActivities } from "../mappers/downtime.mapper";

let cache: DowntimeActivity[] | null = null;

export async function getAllDowntimeActivities(): Promise<DowntimeActivity[]> {
  if (cache) return cache;
  const rawData = await getVariantRulesRaw();
  cache = mapDowntimeActivities(rawData);
  return cache;
}

export function clearDowntimeCache(): void {
  cache = null;
}
