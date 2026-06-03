import type { DndItem } from "@/shared/types/dnd-item.types";
import { clearFiveToolsJsonCache } from "@/shared/data/fivetools-fetch";
import { mapDndItem } from "../mappers/item.mapper";
import { buildRawItemList } from "../utils/item-list-builder.utils";
import type { ItemBaseIndexes } from "../utils/item-raw.types";

let cache: DndItem[] | null = null;
let indexById: Map<string, DndItem> | null = null;
let indexesCache: ItemBaseIndexes | null = null;

function buildIndex(items: DndItem[]): Map<string, DndItem> {
  const map = new Map<string, DndItem>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}

export async function getAllDndItems(): Promise<DndItem[]> {
  if (cache) return cache;

  const { items: rawItems, indexes } = await buildRawItemList();
  indexesCache = indexes;
  cache = rawItems.map((raw) => mapDndItem(raw, indexes));
  indexById = buildIndex(cache);
  return cache;
}

export async function getDndItemById(id: string): Promise<DndItem | undefined> {
  if (!indexById) {
    await getAllDndItems();
  }
  return indexById?.get(id);
}

export function getDndItemIndexes(): ItemBaseIndexes | null {
  return indexesCache;
}

export function clearDndItemCache(): void {
  cache = null;
  indexById = null;
  indexesCache = null;
  clearFiveToolsJsonCache();
}
