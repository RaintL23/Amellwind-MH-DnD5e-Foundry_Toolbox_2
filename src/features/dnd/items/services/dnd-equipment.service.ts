import type { ArmorItem, Weapon } from "@/shared/types";
import { DEFAULT_DND_ITEM_SOURCES } from "@/shared/constants/api.constants";
import { getAllRawItems, loadItemSources } from "../utils/item-list-builder.utils";
import {
  groupDndWeaponsForCatalog,
  isBuilderDndWeapon,
  mapDndBaseItemToWeapon,
} from "../mappers/dnd-weapon.mapper";
import {
  dedupeDndArmorsByName,
  isBuilderDndArmor,
  mapDndBaseItemToArmor,
} from "../mappers/dnd-armor.mapper";

let allWeaponsCache: Weapon[] | null = null;
let weaponCatalogCache: Weapon[] | null = null;
let weaponCatalogPrefer2024: boolean | null = null;
let armorCache: ArmorItem[] | null = null;
let armorPrefer2024: boolean | null = null;

async function ensureDndWeaponsLoaded(): Promise<Weapon[]> {
  if (allWeaponsCache) return allWeaponsCache;

  await loadItemSources([...DEFAULT_DND_ITEM_SOURCES]);
  allWeaponsCache = getAllRawItems()
    .filter(isBuilderDndWeapon)
    .map(mapDndBaseItemToWeapon);

  return allWeaponsCache;
}

export async function getDndWeapons(prefer2024 = true): Promise<Weapon[]> {
  if (weaponCatalogCache && weaponCatalogPrefer2024 === prefer2024) {
    return weaponCatalogCache;
  }

  const allWeapons = await ensureDndWeaponsLoaded();
  weaponCatalogCache = groupDndWeaponsForCatalog(allWeapons, prefer2024);
  weaponCatalogPrefer2024 = prefer2024;
  return weaponCatalogCache;
}

export async function getDndWeaponVariantsByName(
  name: string,
): Promise<Weapon[]> {
  const allWeapons = await ensureDndWeaponsLoaded();
  return allWeapons
    .filter((weapon) => weapon.name === name)
    .sort((a, b) => a.source.localeCompare(b.source));
}

export async function getDndArmors(prefer2024 = true): Promise<ArmorItem[]> {
  if (armorCache && armorPrefer2024 === prefer2024) return armorCache;

  await loadItemSources([...DEFAULT_DND_ITEM_SOURCES]);
  const armors = getAllRawItems()
    .filter(isBuilderDndArmor)
    .map(mapDndBaseItemToArmor)
    .filter((armor): armor is ArmorItem => armor !== null);

  armorCache = dedupeDndArmorsByName(armors, prefer2024);
  armorPrefer2024 = prefer2024;
  return armorCache;
}

export function clearDndEquipmentCache(): void {
  allWeaponsCache = null;
  weaponCatalogCache = null;
  weaponCatalogPrefer2024 = null;
  armorCache = null;
  armorPrefer2024 = null;
}
