import { DEFAULT_BESTIARY_SOURCES } from "@/shared/constants/api.constants";
import { clearFiveToolsJsonCache } from "@/shared/data/fivetools-fetch";
import { createOnDemandEntityService } from "@/shared/services/create-on-demand-entity-service";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { mapBestiaryCreature } from "../mappers/bestiary.mapper";
import {
  clearBestiaryBuilderCache,
  getAllRawMonsters,
  getAvailableSources,
  getBestiaryIndex,
  getLoadedBestiarySources,
  loadBestiarySource,
  loadBestiarySources,
} from "../utils/bestiary-list-builder.utils";
import {
  creatureEntityKey,
  parseCreatureHashFromRoute,
  toCreatureHash,
} from "../utils/bestiary-hash.utils";
import { dedupeCreaturesByName } from "../utils/bestiary-dedupe.utils";
import { sortCreatureVariants } from "../utils/bestiary-variant.utils";
import type { RawMonster } from "../utils/bestiary-raw.types";
import { clearFluffLairCache, getLairFromFluff } from "./fluff-lair.service";
import { clearLegendaryCache, getLegendaryGroupForMonster } from "./legendary-group.service";

const service = createOnDemandEntityService<RawMonster, BestiaryCreature>({
  defaultSources: DEFAULT_BESTIARY_SOURCES,
  loadSources: loadBestiarySources,
  loadSource: loadBestiarySource,
  getAllRaw: getAllRawMonsters,
  entityKey: (raw) => creatureEntityKey(raw.name, raw.source),
  map: mapBestiaryCreature,
  idOf: (creature) => creature.id,
  nameOf: (creature) => creature.name,
  dedupe: dedupeCreaturesByName,
  sortVariantGroup: sortCreatureVariants,
  getSourceCatalog: async () => {
    const index = await getBestiaryIndex();
    return {
      available: getAvailableSources(index),
      loaded: getLoadedBestiarySources(),
    };
  },
  onClearCache: () => {
    clearBestiaryBuilderCache();
    clearFiveToolsJsonCache();
    clearLegendaryCache();
    clearFluffLairCache();
  },
});

export const getAllBestiaryCreatures = service.getAll;
export const getListBestiaryCreatures = service.getList;
export const preloadBestiarySources = service.preloadSources;
export const loadSourceOnDemand = service.loadSourceOnDemand;
export const getBestiarySourceCatalog = service.getSourceCatalog;
export const clearBestiaryCache = service.clearCache;

async function findCreatureByNameSource(
  name: string,
  source: string,
): Promise<BestiaryCreature | undefined> {
  const exact = await service.getByName(name);
  if (exact.length > 0) {
    return exact.find((c) => c.source === source) ?? exact[0];
  }

  // Entity links may title-case articles ("Beast Of The Sea") while 5etools
  // keeps them lowercase ("Beast of the Sea").
  const all = await service.getAll();
  const needle = name.toLowerCase();
  const matches = all.filter((c) => c.name.toLowerCase() === needle);
  if (matches.length === 0) return undefined;

  const sourceNeedle = source.toLowerCase();
  return (
    matches.find((c) => c.source.toLowerCase() === sourceNeedle) ?? matches[0]
  );
}

export async function getBestiaryCreatureById(
  id: string,
): Promise<BestiaryCreature | undefined> {
  const direct = await service.getById(id);
  if (direct) return direct;

  const parsed = parseCreatureHashFromRoute(id);
  if (!parsed) return undefined;

  const canonicalId = toCreatureHash(parsed.name, parsed.source);
  const byCanonical = await service.getById(canonicalId);
  if (byCanonical) return byCanonical;

  // Companion / summon blocks often live outside default sources (TCE, FTD, …).
  const loaded = new Set(getLoadedBestiarySources());
  if (!loaded.has(parsed.source)) {
    await service.loadSourceOnDemand(parsed.source);
    const afterLoad =
      (await service.getById(id)) ?? (await service.getById(canonicalId));
    if (afterLoad) return afterLoad;
  }

  return findCreatureByNameSource(parsed.name, parsed.source);
}

export async function getCreaturesByName(name: string): Promise<BestiaryCreature[]> {
  return service.getByName(name);
}

export async function enrichCreatureWithLegendary(
  creature: BestiaryCreature,
): Promise<BestiaryCreature> {
  if (creature.legendaryGroupRef) {
    const group = await getLegendaryGroupForMonster(creature.legendaryGroupRef);
    if (group) return { ...creature, legendaryGroup: group };
  }

  if (creature.hasFluff || !creature.legendaryGroupRef) {
    const fluffGroup = await getLairFromFluff(creature);
    if (
      fluffGroup &&
      (fluffGroup.lairActions.length > 0 || fluffGroup.regionalEffects.length > 0)
    ) {
      return { ...creature, legendaryGroup: fluffGroup };
    }
  }

  return creature;
}
