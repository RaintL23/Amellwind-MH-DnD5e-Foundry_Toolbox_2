import type { DndItem } from "@/shared/types/dnd-item.types";
import { DEFAULT_DND_ITEM_SOURCES } from "@/shared/constants/api.constants";
import { clearFiveToolsJsonCache } from "@/shared/data/fivetools-fetch";
import { mapDndItem } from "../mappers/item.mapper";
import { clearDndEquipmentCache } from "./dnd-equipment.service";
import {
  clearItemListBuilderCache,
  getAllRawItems,
  getAvailableItemSources,
  getItemBaseIndexes,
  getLoadedItemSources,
  getRawItemSource,
  isItemSourceLoaded,
  loadItemSource,
  loadItemSources,
} from "../utils/item-list-builder.utils";
import type { ItemBaseIndexes, RawItemEntity } from "../utils/item-raw.types";
import { itemEntityKey } from "../utils/item-uids.utils";
import {
  dedupeDndItemsByName,
  sortDndItemVariants,
} from "../utils/item-dedupe.utils";

let cache: DndItem[] = [];
let listCache: DndItem[] | null = null;
let byNameIndex: Map<string, DndItem[]> | null = null;
let indexById: Map<string, DndItem> | null = null;
let indexesCache: ItemBaseIndexes | null = null;
const mappedKeys = new Set<string>();

function buildIndexes(items: DndItem[]): void {
  indexById = new Map<string, DndItem>();
  for (const item of items) indexById.set(item.id, item);

  const byName = new Map<string, DndItem[]>();
  for (const item of items) {
    const group = byName.get(item.name) ?? [];
    group.push(item);
    byName.set(item.name, group);
  }
  byNameIndex = byName;
  listCache = dedupeDndItemsByName(items);
}

function appendMapped(rawItems: RawItemEntity[]): void {
  if (!indexesCache) return;

  const newItems: DndItem[] = [];
  for (const raw of rawItems) {
    const source = getRawItemSource(raw);
    if (!source) continue;
    const key = itemEntityKey({ name: raw.name, source });
    if (mappedKeys.has(key)) continue;
    mappedKeys.add(key);
    newItems.push(mapDndItem(raw, indexesCache));
  }

  if (newItems.length === 0) return;

  cache = [...cache, ...newItems];
  buildIndexes(cache);
}

function syncCacheFromPool(): void {
  appendMapped(getAllRawItems());
}

export async function getAllDndItems(): Promise<DndItem[]> {
  if (cache.length === 0) {
    await loadItemSources([...DEFAULT_DND_ITEM_SOURCES]);
    indexesCache = getItemBaseIndexes();
    syncCacheFromPool();
  }
  return cache;
}

export async function getListDndItems(): Promise<DndItem[]> {
  await getAllDndItems();
  return listCache ?? [];
}

export async function preloadDndItemSources(sources: string[]): Promise<DndItem[]> {
  await loadItemSources(sources);
  indexesCache = getItemBaseIndexes();
  syncCacheFromPool();
  return cache;
}

export async function loadSourceOnDemand(source: string): Promise<DndItem[]> {
  await loadItemSource(source);
  indexesCache = getItemBaseIndexes();
  syncCacheFromPool();
  return cache;
}

export async function getDndItemsByName(name: string): Promise<DndItem[]> {
  await getAllDndItems();
  const group = byNameIndex?.get(name) ?? [];
  return sortDndItemVariants(group);
}

export async function getDndItemById(id: string): Promise<DndItem | undefined> {
  if (indexById === null) await getAllDndItems();
  return indexById?.get(id);
}

export async function getDndItemSourceCatalog(): Promise<{
  available: string[];
  loaded: string[];
}> {
  const available = await getAvailableItemSources();
  return {
    available,
    loaded: getLoadedItemSources(),
  };
}

export function isDndItemSourceLoaded(source: string): boolean {
  return isItemSourceLoaded(source);
}

/** Ensures indexes exist (e.g. detail views); does not load extra sources. */
export async function ensureDndItemIndexes(): Promise<ItemBaseIndexes> {
  await getAllDndItems();
  return indexesCache ?? getItemBaseIndexes();
}

export function getDndItemIndexes(): ItemBaseIndexes | null {
  return indexesCache;
}

export function clearDndItemCache(): void {
  cache = [];
  listCache = null;
  byNameIndex = null;
  indexById = null;
  indexesCache = null;
  mappedKeys.clear();
  clearItemListBuilderCache();
  clearDndEquipmentCache();
  clearFiveToolsJsonCache();
}
