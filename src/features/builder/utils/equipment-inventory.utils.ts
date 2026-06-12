import { SHOPS } from "@/features/shops/data/shops.data";
import { formatWeaponValue } from "@/features/weapons/services/weapon.service";
import { weaponIncludesShield } from "@/features/weapons/utils/shield.utils";
import { getRaritySlideUnlockSections } from "@/features/weapons/utils/rarity-slide.utils";
import {
  TRINKET_WEIGHT_LB,
  isKnownTrinket,
} from "../data/trinket.data";
import {
  StandaloneShieldItem,
  STANDALONE_SHIELD,
} from "../data/shield.data";
import { ArmorItem, CartEntry, ShopEntry, Weapon } from "@/shared/types";

const DEFAULT_AMMO_BY_WEAPON: Record<string, string> = {
  Bow: "Arrows (20)",
  "Light Bowgun": "Normal Ammo (20)",
  "Heavy Bowgun": "Normal Ammo (20)",
  "Dual Repeaters": "Normal Ammo (20)",
};

function integratedShieldName(weaponName: string): string {
  return `Integrated Shield (${weaponName})`;
}

export function isIntegratedShieldEntry(entry: CartEntry): boolean {
  return entry.inventoryRole === "integrated-shield";
}

export function isDefaultAmmoEntry(entry: CartEntry): boolean {
  return entry.inventoryRole === "default-ammo";
}

export function isTrinketEntry(entry: CartEntry): boolean {
  return entry.inventoryRole === "trinket" || isKnownTrinket(entry.name);
}

function findShopEntry(name: string): ShopEntry | null {
  const normalized = name.trim().toLowerCase();
  for (const shop of SHOPS) {
    for (const section of shop.sections) {
      const match = section.entries.find(
        (entry) => entry.name.trim().toLowerCase() === normalized,
      );
      if (match) return match;
    }
  }
  return null;
}

function findShopAmmoForWeapon(weaponName: string, ammoName: string): ShopEntry | null {
  const direct = findShopEntry(ammoName);
  if (direct) return direct;

  const normalizedAmmo = ammoName.replace(/\s+ammo$/i, "").trim().toLowerCase();
  for (const shop of SHOPS) {
    for (const section of shop.sections) {
      const match = section.entries.find((entry) => {
        const entryName = entry.name.toLowerCase();
        const category = entry.category?.toLowerCase() ?? "";
        const matchesWeapon =
          category === weaponName.toLowerCase() ||
          category.includes(weaponName.toLowerCase());
        const matchesAmmo =
          entryName.includes(normalizedAmmo) || entryName.includes("ammo");
        return matchesWeapon && matchesAmmo;
      });
      if (match) return match;
    }
  }

  return null;
}

function getFirstUnlockedAmmoName(weapon: Weapon): string | null {
  const sections = getRaritySlideUnlockSections(weapon.rarityRows, 0);
  const ammoSection = sections.find((section) => /ammo/i.test(section.label));
  return ammoSection?.items[0] ?? null;
}

function resolveDefaultAmmoEntry(weapon: Weapon): CartEntry | null {
  if (!weapon.properties.includes("A")) return null;

  const preferredName =
    DEFAULT_AMMO_BY_WEAPON[weapon.name] ?? getFirstUnlockedAmmoName(weapon);
  if (!preferredName) return null;

  const shopEntry = findShopAmmoForWeapon(weapon.name, preferredName);
  if (!shopEntry) {
    return {
      name: preferredName,
      cost: "—",
      weight: "—",
      quantity: 1,
      linkedWeaponName: weapon.name,
      inventoryRole: "default-ammo",
    };
  }

  return {
    name: shopEntry.name,
    cost: shopEntry.cost,
    weight: shopEntry.weight,
    quantity: 1,
    linkedWeaponName: weapon.name,
    inventoryRole: "default-ammo",
  };
}

export function weaponToCartEntry(weapon: Weapon): CartEntry {
  return {
    name: weapon.name,
    cost: formatWeaponValue(weapon.valueCp),
    weight: `${weapon.weight} lb.`,
    quantity: 1,
  };
}

export function armorToCartEntry(armor: ArmorItem): CartEntry {
  return {
    name: armor.name,
    cost: "—",
    weight: `${armor.weight} lb.`,
    quantity: 1,
  };
}

export function shieldToCartEntry(
  shield: StandaloneShieldItem = STANDALONE_SHIELD,
): CartEntry {
  return {
    name: shield.name,
    cost: "—",
    weight: `${shield.weight} lb.`,
    quantity: 1,
  };
}

export function buildShieldInventoryBundle(
  shield: StandaloneShieldItem = STANDALONE_SHIELD,
): CartEntry[] {
  return [shieldToCartEntry(shield)];
}

export function buildWeaponInventoryBundle(weapon: Weapon): CartEntry[] {
  const bundle: CartEntry[] = [weaponToCartEntry(weapon)];

  if (weaponIncludesShield(weapon)) {
    bundle.push({
      name: integratedShieldName(weapon.name),
      cost: "—",
      weight: "—",
      quantity: 1,
      linkedWeaponName: weapon.name,
      inventoryRole: "integrated-shield",
    });
  }

  const ammoEntry = resolveDefaultAmmoEntry(weapon);
  if (ammoEntry) bundle.push(ammoEntry);

  return bundle;
}

export function buildArmorInventoryBundle(armor: ArmorItem): CartEntry[] {
  return [armorToCartEntry(armor)];
}

export function trinketToCartEntry(name: string): CartEntry {
  return {
    name,
    cost: "—",
    weight: `${TRINKET_WEIGHT_LB} lb.`,
    quantity: 1,
    inventoryRole: "trinket",
  };
}

export function buildTrinketInventoryBundle(name: string): CartEntry[] {
  return [trinketToCartEntry(name)];
}

export function getLinkedInventoryNames(weaponName: string): string[] {
  return [
    weaponName,
    integratedShieldName(weaponName),
  ];
}
