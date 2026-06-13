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
  Longbow: "Arrows (20)",
  Shortbow: "Arrows (20)",
  "Light Crossbow": "Crossbow Bolts (20)",
  "Hand Crossbow": "Crossbow Bolts (20)",
  "Heavy Crossbow": "Crossbow Bolts (20)",
  "Light Bowgun": "Normal Ammo (20)",
  "Heavy Bowgun": "Normal Ammo (20)",
  "Dual Repeaters": "Normal Ammo (20)",
};

const DND_AMMO_BY_TYPE: Record<string, string> = {
  "arrow|phb": "Arrows (20)",
  "arrow|xphb": "Arrows (20)",
  "crossbow bolt|phb": "Crossbow Bolts (20)",
  "bolt|xphb": "Crossbow Bolts (20)",
  "sling bullet|phb": "Sling Bullets (20)",
  "bullet|xphb": "Sling Bullets (20)",
  "blowgun needle|phb": "Blowgun Needles (50)",
  "needle|xphb": "Blowgun Needles (50)",
};

const DND_AMMO_FALLBACK: Record<string, { name: string; cost: string; weight: string }> = {
  "Arrows (20)": { name: "Arrows (20)", cost: "1 gp", weight: "1 lb." },
  "Crossbow Bolts (20)": {
    name: "Crossbow Bolts (20)",
    cost: "1 gp",
    weight: "1.5 lb.",
  },
  "Sling Bullets (20)": {
    name: "Sling Bullets (20)",
    cost: "4 cp",
    weight: "1.5 lb.",
  },
  "Blowgun Needles (50)": {
    name: "Blowgun Needles (50)",
    cost: "1 gp",
    weight: "1 lb.",
  },
};

function resolveDndDefaultAmmoName(weapon: Weapon): string | null {
  if (weapon.ammoType) {
    const direct = DND_AMMO_BY_TYPE[weapon.ammoType.toLowerCase()];
    if (direct) return direct;

    const normalized = weapon.ammoType.toLowerCase();
    if (normalized.includes("crossbow") || normalized.includes("bolt")) {
      return "Crossbow Bolts (20)";
    }
    if (normalized.includes("arrow")) return "Arrows (20)";
    if (normalized.includes("sling") || normalized.includes("bullet")) {
      return "Sling Bullets (20)";
    }
    if (normalized.includes("blowgun") || normalized.includes("needle")) {
      return "Blowgun Needles (50)";
    }
  }

  return DEFAULT_AMMO_BY_WEAPON[weapon.name] ?? null;
}

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
    weapon.contentSource === "dnd"
      ? resolveDndDefaultAmmoName(weapon)
      : (DEFAULT_AMMO_BY_WEAPON[weapon.name] ?? getFirstUnlockedAmmoName(weapon));
  if (!preferredName) return null;

  const shopEntry = findShopAmmoForWeapon(weapon.name, preferredName);
  if (!shopEntry) {
    const fallback = DND_AMMO_FALLBACK[preferredName];
    return {
      name: preferredName,
      cost: fallback?.cost ?? "—",
      weight: fallback?.weight ?? "—",
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
