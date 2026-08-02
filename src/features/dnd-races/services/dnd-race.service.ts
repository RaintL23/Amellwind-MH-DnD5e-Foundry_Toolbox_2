import type { DndRace } from "@/shared/types";
import {
  FLUFF_RACES_JSON_URL,
  RACES_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { attachFluffEntries } from "@/shared/utils/fluff.utils";
import {
  bySource,
  createEntityService,
} from "@/shared/services/create-entity-service";
import {
  getSourceCatalog,
  isOnDemandBrewSourceKind,
} from "@/shared/services/source-catalog.service";
import {
  collectUaPropEntries,
  loadUaBrewDocuments,
} from "@/shared/services/ua-brew.service";
import { mapDndRace } from "../mappers/dnd-race.mapper";
import {
  dedupeDndRacesByName,
  dedupeDndRootRacesForBuilderList,
  filterDndSubracesForParent,
} from "../utils/dnd-race-dedupe.utils";

type RawRaceEntry = Record<string, unknown>;

const loadedUaSources = new Set<string>();

const service = createEntityService<RawRaceEntry, DndRace>({
  loadRaw: async () => {
    const [data, fluffData] = await Promise.all([
      fetchFiveToolsJson<{
        race?: RawRaceEntry[];
        subrace?: RawRaceEntry[];
      }>(RACES_JSON_URL, "races.json"),
      fetchFiveToolsJson<{ raceFluff?: RawRaceEntry[] }>(
        FLUFF_RACES_JSON_URL,
        "fluff-races.json",
      ).catch(() => ({ raceFluff: [] as RawRaceEntry[] })),
    ]);

    const rawRaces = Array.isArray(data.race) ? data.race : [];
    const rawSubraces = Array.isArray(data.subrace) ? data.subrace : [];

    let combined = [...rawRaces, ...rawSubraces] as (RawRaceEntry & {
      name: string;
      source: string;
    })[];

    if (loadedUaSources.size > 0) {
      const docs = await loadUaBrewDocuments(loadedUaSources);
      const uaRaces = collectUaPropEntries<RawRaceEntry>(docs, "race");
      const uaSubraces = collectUaPropEntries<RawRaceEntry>(docs, "subrace");
      combined = [
        ...combined,
        ...(uaRaces as (RawRaceEntry & { name: string; source: string })[]),
        ...(uaSubraces as (RawRaceEntry & { name: string; source: string })[]),
      ];
    }

    const fluffEntries = Array.isArray(fluffData.raceFluff)
      ? fluffData.raceFluff
      : [];
    const withFluff = attachFluffEntries(
      resolveByNameSource(combined),
      resolveByNameSource(
        fluffEntries.filter(
          (e): e is RawRaceEntry & { name: string; source: string } =>
            typeof e.name === "string" && typeof e.source === "string",
        ),
      ),
    );

    return withFluff as (RawRaceEntry & { name: string; source: string })[];
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

export async function ensureDndRaceUaSourcesLoaded(
  sourceCodes: string[],
): Promise<boolean> {
  const catalog = await getSourceCatalog();
  const needed = sourceCodes.filter((code) => {
    const kind = catalog.get(code)?.kind;
    return isOnDemandBrewSourceKind(kind) && !loadedUaSources.has(code);
  });
  if (needed.length === 0) return false;
  for (const code of needed) loadedUaSources.add(code);
  service.clearCache();
  await service.getAll();
  return true;
}

export async function getDndRaceFilterSourceCodes(): Promise<string[]> {
  const [catalog, list] = await Promise.all([
    getSourceCatalog(),
    getListDndRaces(),
  ]);
  const codes = new Set(
    list.flatMap((r) => r.variantSources ?? [r.source]),
  );
  for (const [code, entry] of catalog) {
    if (
      entry.uaPath &&
      (entry.uaPath.startsWith("race/") ||
        entry.uaPath.startsWith("subrace/") ||
        entry.uaPath.startsWith("collection/"))
    ) {
      codes.add(code);
    }
  }
  return [...codes];
}

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
