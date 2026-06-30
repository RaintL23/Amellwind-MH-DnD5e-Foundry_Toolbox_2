import type { DndRace } from "@/shared/types";
import { RACES_JSON_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import {
  bySource,
  createEntityService,
} from "@/shared/services/create-entity-service";
import { mapDndRace } from "../mappers/dnd-race.mapper";
import {
  dedupeDndRacesByName,
  dedupeDndRootRacesForBuilderList,
  filterDndSubracesForParent,
} from "../utils/dnd-race-dedupe.utils";

type RawRaceEntry = Record<string, unknown>;

const service = createEntityService<RawRaceEntry, DndRace>({
  loadRaw: async () => {
    const data = await fetchFiveToolsJson<{
      race?: RawRaceEntry[];
      subrace?: RawRaceEntry[];
    }>(RACES_JSON_URL, "races.json");

    const rawRaces = Array.isArray(data.race) ? data.race : [];
    const rawSubraces = Array.isArray(data.subrace) ? data.subrace : [];

    const combined = [...rawRaces, ...rawSubraces] as (RawRaceEntry & {
      name: string;
      source: string;
    })[];

    return resolveByNameSource(combined);
  },
  map: (raw) => mapDndRace(raw),
  idOf: (race) => race.id,
  nameOf: (race) => race.name,
  dedupe: dedupeDndRacesByName,
  sortVariants: bySource,
});

export const getAllDndRaces = service.getAll;
export const getListDndRaces = service.getList;
export const getDndRacesByName = service.getByName;
export const getDndRaceById = service.getById;
export const clearDndRaceCache = service.clearCache;

export async function getBuilderListDndRaces(): Promise<DndRace[]> {
  return dedupeDndRootRacesForBuilderList(await service.getAll());
}

export async function getDndSubracesForParent(
  parentName: string,
  parentSource: string,
): Promise<DndRace[]> {
  return filterDndSubracesForParent(
    await service.getAll(),
    parentName,
    parentSource,
  );
}
