import type { Weapon } from "@/shared/types";
import {
  getAllRawItems,
  loadItemSources,
} from "@/features/dnd-items/utils/item-list-builder.utils";
import {
  groupDndWeaponsForCatalog,
  isBuilderDndWeapon,
  mapDndBaseItemToWeapon,
} from "../mappers/dnd-weapon.mapper";

const DND_BUILDER_WEAPON_SOURCES = ["PHB", "XPHB", "DMG", "XDMG"] as const;

let allWeaponsCache: Weapon[] | null = null;
let catalogCache: Weapon[] | null = null;
let cachePrefer2024: boolean | null = null;

async function ensureDndBuilderWeaponsLoaded(): Promise<Weapon[]> {
  if (allWeaponsCache) return allWeaponsCache;

  await loadItemSources([...DND_BUILDER_WEAPON_SOURCES]);

  allWeaponsCache = getAllRawItems()
    .filter(isBuilderDndWeapon)
    .map(mapDndBaseItemToWeapon);

  return allWeaponsCache;
}

export async function getDndBuilderWeapons(
  prefer2024 = true,
): Promise<Weapon[]> {
  if (catalogCache && cachePrefer2024 === prefer2024) return catalogCache;

  const allWeapons = await ensureDndBuilderWeaponsLoaded();
  catalogCache = groupDndWeaponsForCatalog(allWeapons, prefer2024);
  cachePrefer2024 = prefer2024;
  return catalogCache;
}

export async function getDndBuilderWeaponVariantsByName(
  name: string,
): Promise<Weapon[]> {
  const allWeapons = await ensureDndBuilderWeaponsLoaded();
  return allWeapons
    .filter((weapon) => weapon.name === name)
    .sort((a, b) => a.source.localeCompare(b.source));
}

export function clearDndBuilderWeaponsCache(): void {
  allWeaponsCache = null;
  catalogCache = null;
  cachePrefer2024 = null;
}
