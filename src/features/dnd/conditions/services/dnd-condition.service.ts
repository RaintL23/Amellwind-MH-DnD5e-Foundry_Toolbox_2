import type { DndCondition, DndDisease } from "@/shared/types";
import { CONDITIONS_DISEASES_JSON_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import {
  bySource,
  createEntityService,
} from "@/shared/services/create-entity-service";
import { mapDndCondition, mapDndDisease } from "../mappers/dnd-condition.mapper";
import {
  dedupeDndConditionsByName,
  dedupeDndDiseasesByName,
} from "../utils/dnd-condition-dedupe.utils";

type RawEntry = Record<string, unknown> & { name?: string; source?: string };

interface ConditionsDiseasesDoc {
  condition?: RawEntry[];
  disease?: RawEntry[];
  status?: RawEntry[];
}

let docPromise: Promise<ConditionsDiseasesDoc> | null = null;

function loadDoc(): Promise<ConditionsDiseasesDoc> {
  if (!docPromise) {
    docPromise = fetchFiveToolsJson<ConditionsDiseasesDoc>(
      CONDITIONS_DISEASES_JSON_URL,
      "conditionsdiseases.json",
    ).catch((error) => {
      docPromise = null;
      throw error;
    });
  }
  return docPromise;
}

const conditionService = createEntityService<
  RawEntry & { __category: "condition" | "status" },
  DndCondition
>({
  loadRaw: async () => {
    const doc = await loadDoc();
    const conditions = (Array.isArray(doc.condition) ? doc.condition : []).map(
      (raw) => ({ ...raw, __category: "condition" as const }),
    );
    const statuses = (Array.isArray(doc.status) ? doc.status : []).map(
      (raw) => ({ ...raw, __category: "status" as const }),
    );
    return [...conditions, ...statuses];
  },
  map: (raw) => mapDndCondition(raw, raw.__category),
  idOf: (item) => item.id,
  nameOf: (item) => item.name,
  dedupe: dedupeDndConditionsByName,
  sortVariants: bySource,
});

const diseaseService = createEntityService<RawEntry, DndDisease>({
  loadRaw: async () => {
    const doc = await loadDoc();
    return Array.isArray(doc.disease) ? doc.disease : [];
  },
  map: (raw) => mapDndDisease(raw),
  idOf: (item) => item.id,
  nameOf: (item) => item.name,
  dedupe: dedupeDndDiseasesByName,
  sortVariants: bySource,
});

export const getAllDndConditions = conditionService.getAll;
export const getListDndConditions = conditionService.getList;
export const getDndConditionsByName = conditionService.getByName;
export const getDndConditionById = conditionService.getById;
export const clearDndConditionCache = conditionService.clearCache;

export const getAllDndDiseases = diseaseService.getAll;
export const getListDndDiseases = diseaseService.getList;
export const getDndDiseasesByName = diseaseService.getByName;
export const getDndDiseaseById = diseaseService.getById;
export const clearDndDiseaseCache = diseaseService.clearCache;

export function clearDndConditionsDiseasesCaches(): void {
  docPromise = null;
  clearDndConditionCache();
  clearDndDiseaseCache();
}
