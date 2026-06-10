import { BASE_ARMORS, CLOTHING_ARMOR } from "../data/armor.placeholder";
import { isKnownTrinket } from "../data/trinket.placeholder";
import { isTrinketEntry } from "./equipment-inventory.utils";
import { ArmorItem, CartEntry, Weapon } from "@/shared/types";

const ARMOR_CATALOG: ArmorItem[] = [...BASE_ARMORS, CLOTHING_ARMOR];

export type CartItemKind = "weapon" | "armor" | "trinket" | "other";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function findArmorByCartName(name: string): ArmorItem | null {
  const normalized = normalizeName(name);
  const exact = ARMOR_CATALOG.find((a) => normalizeName(a.name) === normalized);
  if (exact) return exact;

  const withoutArmorSuffix = name.replace(/\s+armor$/i, "").trim();
  if (withoutArmorSuffix !== name) {
    const match = ARMOR_CATALOG.find(
      (a) => normalizeName(a.name) === normalizeName(withoutArmorSuffix),
    );
    if (match) return match;
  }

  return null;
}

export function findWeaponByCartName(
  name: string,
  catalog: Weapon[],
): Weapon | null {
  const normalized = normalizeName(name);
  return catalog.find((w) => normalizeName(w.name) === normalized) ?? null;
}

export function classifyCartEntry(
  entry: CartEntry,
  weaponCatalog: Weapon[],
): CartItemKind {
  if (findWeaponByCartName(entry.name, weaponCatalog)) return "weapon";
  if (findArmorByCartName(entry.name)) return "armor";
  if (isTrinketEntry(entry) || isKnownTrinket(entry.name)) return "trinket";
  return "other";
}

export function resolveEquippableFromCart(
  cartItems: CartEntry[],
  weaponCatalog: Weapon[],
): { weapons: Weapon[]; armors: ArmorItem[]; trinkets: string[] } {
  const weapons: Weapon[] = [];
  const armors: ArmorItem[] = [];
  const trinkets: string[] = [];
  const seenWeapons = new Set<string>();
  const seenArmors = new Set<string>();
  const seenTrinkets = new Set<string>();

  for (const entry of cartItems) {
    const weapon = findWeaponByCartName(entry.name, weaponCatalog);
    if (weapon && !seenWeapons.has(weapon.name)) {
      seenWeapons.add(weapon.name);
      weapons.push(weapon);
      continue;
    }

    const armor = findArmorByCartName(entry.name);
    if (armor && !seenArmors.has(armor.name)) {
      seenArmors.add(armor.name);
      armors.push(armor);
      continue;
    }

    if (
      (isTrinketEntry(entry) || isKnownTrinket(entry.name)) &&
      !seenTrinkets.has(entry.name)
    ) {
      seenTrinkets.add(entry.name);
      trinkets.push(entry.name);
    }
  }

  return { weapons, armors, trinkets };
}
