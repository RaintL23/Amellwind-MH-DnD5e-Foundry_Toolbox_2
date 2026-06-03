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
import { clearLegendaryCache, getLegendaryGroupForMonster } from "./legendary-group.service";

let cache: BestiaryCreature[] | null = null;
let indexById: Map<string, BestiaryCreature> | null = null;

function buildIndex(creatures: BestiaryCreature[]): Map<string, BestiaryCreature> {
  const map = new Map<string, BestiaryCreature>();
  for (const c of creatures) map.set(c.id, c);
  return map;
}

function rebuildCache(): void {
  cache = getAllRawMonsters().map(mapBestiaryCreature);
  indexById = buildIndex(cache);
}

export async function getAllBestiaryCreatures(): Promise<BestiaryCreature[]> {
  if (!cache) {
    await loadBestiarySources([...DEFAULT_BESTIARY_SOURCES]);
    rebuildCache();
  }
  return cache!;
}

export async function preloadBestiarySources(sources: string[]): Promise<BestiaryCreature[]> {
  await loadBestiarySources(sources);
  rebuildCache();
  return cache!;
}

export async function loadSourceOnDemand(source: string): Promise<BestiaryCreature[]> {
  await loadBestiarySource(source);
  rebuildCache();
  return cache!;
}

export async function getBestiaryCreatureById(id: string): Promise<BestiaryCreature | undefined> {
  if (!indexById) await getAllBestiaryCreatures();
  return indexById?.get(id);
}

export async function enrichCreatureWithLegendary(
  creature: BestiaryCreature,
): Promise<BestiaryCreature> {
  if (!creature.legendaryGroupRef) return creature;
  const group = await getLegendaryGroupForMonster(creature.legendaryGroupRef);
  return group ? { ...creature, legendaryGroup: group } : creature;
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

export function clearBestiaryCache(): void {
  cache = null;
  indexById = null;
  clearBestiaryBuilderCache();
  clearLegendaryCache();
  clearFiveToolsJsonCache();
}
