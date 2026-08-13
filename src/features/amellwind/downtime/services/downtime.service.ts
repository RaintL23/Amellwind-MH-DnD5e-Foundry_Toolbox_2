import type { DowntimeActivity } from "@/shared/types";
import { getVariantRulesRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapDowntimeActivities } from "../mappers/downtime.mapper";

const service = createEntityService<DowntimeActivity, DowntimeActivity>({
  loadRaw: async () => mapDowntimeActivities(await getVariantRulesRaw()),
  map: (activity) => activity,
});

export const getAllDowntimeActivities = service.getAll;
export const clearDowntimeCache = service.clearCache;
