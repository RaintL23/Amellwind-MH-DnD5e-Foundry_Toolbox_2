import { DEFAULT_BESTIARY_SOURCES } from "@/shared/constants/api.constants";
import { clearFiveToolsJsonCache } from "@/shared/data/fivetools-fetch";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { mapBestiaryCreature } from "../mappers/bestiary.mapper";
import {
  clearBestiaryBuilderCache,
  getAllRawMonsters,
  getAvailableSources,
  getBestiaryIndex,
  getLoadedBestiarySources,
  isSourceLoaded,
  loadBestiarySource,
  loadBestiarySources,
} from "../utils/bestiary-list-builder.utils";
import {
  creatureEntityKey,
  parseCreatureHashFromRoute,
  toCreatureHash,
} from "../utils/bestiary-hash.utils";
import {
  collectCreatureSources,
  dedupeCreaturesByName,
} from "../utils/bestiary-dedupe.utils";
import { sortCreatureVariants } from "../utils/bestiary-variant.utils";
import type { RawMonster } from "../utils/bestiary-raw.types";
import { clearFluffLairCache, getLairFromFluff } from "./fluff-lair.service";
import { clearLegendaryCache, getLegendaryGroupForMonster } from "./legendary-group.service";

let cache: BestiaryCreature[] = [];
let listCache: BestiaryCreature[] | null = null;
let byNameIndex: Map<string, BestiaryCreature[]> | null = null;
let indexById: Map<string, BestiaryCreature> | null = null;
const mappedKeys = new Set<string>();

function buildIndexes(creatures: BestiaryCreature[]): void {
  indexById = new Map<string, BestiaryCreature>();
  for (const c of creatures) indexById.set(c.id, c);

  const byName = new Map<string, BestiaryCreature[]>();
  for (const c of creatures) {
    const group = byName.get(c.name) ?? [];
    group.push(c);
    byName.set(c.name, group);
  }
  byNameIndex = byName;
  listCache = dedupeCreaturesByName(creatures);
}

function appendMapped(rawMonsters: RawMonster[]): void {
  const newCreatures: BestiaryCreature[] = [];

  for (const raw of rawMonsters) {
    const key = creatureEntityKey(raw.name, raw.source);
    if (mappedKeys.has(key)) continue;
    mappedKeys.add(key);
    newCreatures.push(mapBestiaryCreature(raw));
  }

  if (newCreatures.length === 0) return;

  cache = [...cache, ...newCreatures];
  buildIndexes(cache);
}

function syncCacheFromPool(): void {
  appendMapped(getAllRawMonsters());
}

export async function getAllBestiaryCreatures(): Promise<BestiaryCreature[]> {
  if (cache.length === 0) {
    await loadBestiarySources([...DEFAULT_BESTIARY_SOURCES]);
    syncCacheFromPool();
  }
  return cache;
}

export async function getListBestiaryCreatures(): Promise<BestiaryCreature[]> {
  await getAllBestiaryCreatures();
  return listCache ?? [];
}

export async function preloadBestiarySources(sources: string[]): Promise<BestiaryCreature[]> {
  await loadBestiarySources(sources);
  syncCacheFromPool();
  return cache;
}

export async function loadSourceOnDemand(source: string): Promise<BestiaryCreature[]> {
  await loadBestiarySource(source);
  syncCacheFromPool();
  return cache;
}

export async function getBestiaryCreatureById(id: string): Promise<BestiaryCreature | undefined> {
  if (indexById === null) await getAllBestiaryCreatures();

  const direct = indexById?.get(id);
  if (direct) return direct;

  const parsed = parseCreatureHashFromRoute(id);
  if (!parsed) return undefined;

  const canonicalId = toCreatureHash(parsed.name, parsed.source);
  const byCanonical = indexById?.get(canonicalId);
  if (byCanonical) return byCanonical;

  const group = byNameIndex?.get(parsed.name);
  if (!group?.length) return undefined;

  return (
    group.find((c) => c.source === parsed.source) ??
    group[0]
  );
}

export async function getCreaturesByName(name: string): Promise<BestiaryCreature[]> {
  await getAllBestiaryCreatures();
  const group = byNameIndex?.get(name) ?? [];
  return sortCreatureVariants(group);
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

export async function getBestiarySourceCatalog(): Promise<{
  available: string[];
  loaded: string[];
}> {
  const index = await getBestiaryIndex();
  return {
    available: getAvailableSources(index),
    loaded: getLoadedBestiarySources(),
  };
}

export function isBestiarySourceLoaded(source: string): boolean {
  return isSourceLoaded(source);
}

export function collectBestiarySources(creatures: BestiaryCreature[]): string[] {
  return collectCreatureSources(creatures);
}

export function clearBestiaryCache(): void {
  cache = [];
  listCache = null;
  byNameIndex = null;
  indexById = null;
  mappedKeys.clear();
  clearBestiaryBuilderCache();
  clearFiveToolsJsonCache();
  clearLegendaryCache();
  clearFluffLairCache();
}
