import type { DndRace } from "@/shared/types";
import { RACES_JSON_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { mapDndRace } from "../mappers/dnd-race.mapper";
import { dedupeDndRacesByName, dedupeDndRootRacesForBuilderList, filterDndSubracesForParent } from "../utils/dnd-race-dedupe.utils";

let cache: DndRace[] | null = null;
let listCache: DndRace[] | null = null;
let builderListCache: DndRace[] | null = null;
let byNameIndex: Map<string, DndRace[]> | null = null;
let byIdIndex: Map<string, DndRace> | null = null;

function buildIndexes(all: DndRace[]): void {
  byIdIndex = new Map(all.map((r) => [r.id, r]));

  const byName = new Map<string, DndRace[]>();
  for (const race of all) {
    const group = byName.get(race.name) ?? [];
    group.push(race);
    byName.set(race.name, group);
  }
  byNameIndex = byName;
  listCache = dedupeDndRacesByName(all);
  builderListCache = dedupeDndRootRacesForBuilderList(all);
}

type RawRaceEntry = Record<string, unknown>;

export async function getAllDndRaces(): Promise<DndRace[]> {
  if (cache) return cache;

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

  const resolved = resolveByNameSource(combined);
  cache = resolved.map((raw) => mapDndRace(raw));
  buildIndexes(cache);
  return cache;
}

export async function getListDndRaces(): Promise<DndRace[]> {
  await getAllDndRaces();
  return listCache ?? [];
}

export async function getBuilderListDndRaces(): Promise<DndRace[]> {
  await getAllDndRaces();
  return builderListCache ?? [];
}

export async function getDndSubracesForParent(
  parentName: string,
  parentSource: string,
): Promise<DndRace[]> {
  await getAllDndRaces();
  return filterDndSubracesForParent(cache ?? [], parentName, parentSource);
}

export async function getDndRacesByName(name: string): Promise<DndRace[]> {
  await getAllDndRaces();
  const group = byNameIndex?.get(name) ?? [];
  return [...group].sort((a, b) => a.source.localeCompare(b.source));
}

export async function getDndRaceById(id: string): Promise<DndRace | undefined> {
  await getAllDndRaces();
  return byIdIndex?.get(id);
}

export function clearDndRaceCache(): void {
  cache = null;
  listCache = null;
  builderListCache = null;
  byNameIndex = null;
  byIdIndex = null;
}
