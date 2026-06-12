import type { Weapon } from "@/shared/types";
import {
  getAllRawItems,
  loadItemSources,
} from "@/features/dnd-items/utils/item-list-builder.utils";
import type { RawItemEntity } from "@/features/dnd-items/utils/item-raw.types";
import {
  dedupeDndWeaponsByName,
  mapDndBaseItemToWeapon,
} from "../mappers/dnd-weapon.mapper";

let cache: Weapon[] | null = null;
let cachePrefer2024: boolean | null = null;

function isBuilderDndWeapon(raw: RawItemEntity): boolean {
  if (raw.weapon !== true) return false;
  if (raw.age === "futuristic") return false;
  if (raw.firearm === true) return false;
  if (raw.rarity && raw.rarity !== "none") return false;
  return true;
}

export async function getDndBuilderWeapons(
  prefer2024 = true,
): Promise<Weapon[]> {
  if (cache && cachePrefer2024 === prefer2024) return cache;

  await loadItemSources(["PHB", "XPHB"]);

  const weapons = getAllRawItems()
    .filter((item) => item._isBaseItem && isBuilderDndWeapon(item))
    .map(mapDndBaseItemToWeapon);

  cache = dedupeDndWeaponsByName(weapons, prefer2024);
  cachePrefer2024 = prefer2024;
  return cache;
}

export function clearDndBuilderWeaponsCache(): void {
  cache = null;
  cachePrefer2024 = null;
}
