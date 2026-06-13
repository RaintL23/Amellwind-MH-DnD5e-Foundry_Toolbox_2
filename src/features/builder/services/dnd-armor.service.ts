import type { ArmorItem } from "@/shared/types";
import {
  getAllRawItems,
  loadItemSources,
} from "@/features/dnd-items/utils/item-list-builder.utils";
import {
  dedupeDndArmorsByName,
  isBuilderDndArmor,
  mapDndBaseItemToArmor,
} from "../mappers/dnd-armor.mapper";

const DND_BUILDER_ARMOR_SOURCES = ["PHB", "XPHB", "DMG", "XDMG"] as const;

let cache: ArmorItem[] | null = null;
let cachePrefer2024: boolean | null = null;

export async function getDndBuilderArmors(
  prefer2024 = true,
): Promise<ArmorItem[]> {
  if (cache && cachePrefer2024 === prefer2024) return cache;

  await loadItemSources([...DND_BUILDER_ARMOR_SOURCES]);

  const armors = getAllRawItems()
    .filter(isBuilderDndArmor)
    .map(mapDndBaseItemToArmor)
    .filter((armor): armor is ArmorItem => armor !== null);

  cache = dedupeDndArmorsByName(armors, prefer2024);
  cachePrefer2024 = prefer2024;
  return cache;
}

export function clearDndBuilderArmorsCache(): void {
  cache = null;
  cachePrefer2024 = null;
}
