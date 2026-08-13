import type { DndItem } from "@/shared/types/dnd-item.types";
import { DEFAULT_DND_ITEM_SOURCES } from "@/shared/constants/api.constants";
import { clearFiveToolsJsonCache } from "@/shared/data/fivetools-fetch";
import { createOnDemandEntityService } from "@/shared/services/create-on-demand-entity-service";
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

let indexesCache: ItemBaseIndexes | null = null;

const service = createOnDemandEntityService<RawItemEntity, DndItem>({
  defaultSources: DEFAULT_DND_ITEM_SOURCES,
  loadSources: loadItemSources,
  loadSource: loadItemSource,
  getAllRaw: getAllRawItems,
  entityKey: (raw) => {
    const source = getRawItemSource(raw);
    if (!source) return null;
    return itemEntityKey({ name: raw.name, source });
  },
  map: (raw) => mapDndItem(raw, indexesCache!),
  onSourcesLoaded: () => {
    indexesCache = getItemBaseIndexes();
  },
  idOf: (item) => item.id,
  nameOf: (item) => item.name,
  dedupe: dedupeDndItemsByName,
  sortVariantGroup: sortDndItemVariants,
  getSourceCatalog: async () => {
    const available = await getAvailableItemSources();
    return {
      available,
      loaded: getLoadedItemSources(),
    };
  },
  onClearCache: () => {
    indexesCache = null;
    clearItemListBuilderCache();
    clearDndEquipmentCache();
    clearFiveToolsJsonCache();
  },
});

export const getAllDndItems = service.getAll;
export const getListDndItems = service.getList;
export const preloadDndItemSources = service.preloadSources;
export const loadSourceOnDemand = service.loadSourceOnDemand;
export const getDndItemSourceCatalog = service.getSourceCatalog;

export async function getDndItemsByName(name: string): Promise<DndItem[]> {
  return service.getByName(name);
}

/** Specific magic variants produced from a generic variant (e.g. Armor of Lightning Resistance). */
export async function getSpecificVariantsForGeneric(
  genericName: string,
): Promise<DndItem[]> {
  const all = await getAllDndItems();
  return all
    .filter(
      (item) =>
        item.isSpecificVariant &&
        item.variantName?.toLowerCase() === genericName.toLowerCase(),
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function getDndItemById(id: string): Promise<DndItem | undefined> {
  return service.getById(id);
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

export const clearDndItemCache = service.clearCache;
