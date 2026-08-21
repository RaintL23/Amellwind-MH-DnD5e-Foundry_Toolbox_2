/**
 * Canonical sell prices for Weapon Resources (Ammo / Coatings / Magazines).
 *
 * Tier model (Foundry `system.price` = cost of the listed stack quantity):
 * - Basic bulk ×20 → 1 gp | Pierce bulk ×20 → 2 gp | Elemental/Spread ×20 → 3 gp
 * - Sticky / weak control → 1 gp/unit | Status → 4 gp | Strong utility → 5 gp | Wyvern → 10 gp
 * - Coating utility → 1 gp | Coating elemental → 2 gp
 * - Magazine: Normal 2 / elemental 5 / Upgrade I 15 / Dawnstar·Twilight 20
 *
 * AGMH Ammo Vendor rows that are not Foundry resource packs (Tranq, Armor/Demon,
 * Pierce lvl 2–3, Recover lvl 2, Arrows) stay as shop-only extras below.
 */

import type { ShopEntry } from "@/shared/types";

export interface WeaponResourcePriceDef {
  /** Display name without quantity suffix (matches Foundry item name). */
  name: string;
  priceGp: number;
  /** Stack size sold / Foundry `system.quantity`. */
  quantity: number;
  category: string;
  weight: string;
  /** Optional carry-cap / notes shown in Ammo Vendor. */
  extra?: string;
  /**
   * Shop row label override when it differs from `${name} (${quantity})`
   * (e.g. AGMH "Recover lvl 1", "Pierce lvl 1").
   */
  shopName?: string;
}

function entry(def: WeaponResourcePriceDef): WeaponResourcePriceDef {
  return def;
}

/** Sellable stacks that ship in `weapons-resources/` (ammo-lbg, ammo-hbg, coatings, magazines). */
export const WEAPON_RESOURCE_PRICES: WeaponResourcePriceDef[] = [
  // ─── Shared / Bowgun Ammo ───
  entry({
    name: "Normal Ammo",
    priceGp: 1,
    quantity: 20,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 80",
  }),
  entry({
    name: "Paralysis Ammo",
    priceGp: 4,
    quantity: 1,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 4",
  }),
  entry({
    name: "Poison Ammo",
    priceGp: 4,
    quantity: 1,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 8",
  }),
  entry({
    name: "Recover Ammo",
    priceGp: 5,
    quantity: 1,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 4",
    shopName: "Recover lvl 1 (1)",
  }),
  entry({
    name: "Spread Ammo",
    priceGp: 3,
    quantity: 20,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 40",
  }),
  entry({
    name: "Sticky Ammo",
    priceGp: 1,
    quantity: 1,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 10",
  }),

  // ─── Heavy Bowgun ───
  entry({
    name: "Cluster Ammo",
    priceGp: 5,
    quantity: 1,
    category: "Heavy Bowgun",
    weight: "1.5 lb.",
    extra: "Max 5",
  }),
  entry({
    name: "Pierce Ammo",
    priceGp: 2,
    quantity: 20,
    category: "Heavy Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
    shopName: "Pierce lvl 1 (20)",
  }),
  entry({
    name: "Slicing Ammo",
    priceGp: 5,
    quantity: 1,
    category: "Heavy Bowgun",
    weight: "1.5 lb.",
    extra: "Max 5",
  }),
  entry({
    name: "Wyvern Ammo",
    priceGp: 10,
    quantity: 1,
    category: "Heavy Bowgun",
    weight: "1.5 lb.",
    extra: "Max 3",
  }),

  // ─── Light Bowgun ───
  entry({
    name: "Dragon Ammo",
    priceGp: 3,
    quantity: 20,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
  }),
  entry({
    name: "Explosive/Sticky Ammo",
    priceGp: 1,
    quantity: 1,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 10",
  }),
  entry({
    name: "Flaming Ammo",
    priceGp: 3,
    quantity: 20,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
  }),
  entry({
    name: "Freeze Ammo",
    priceGp: 3,
    quantity: 20,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
  }),
  entry({
    name: "Pierce Ammo",
    priceGp: 2,
    quantity: 20,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
    shopName: "Pierce Ammo (20)",
  }),
  entry({
    name: "Sleep Ammo",
    priceGp: 5,
    quantity: 1,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 5",
  }),
  entry({
    name: "Thunder Ammo",
    priceGp: 3,
    quantity: 20,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
  }),
  entry({
    name: "Water Ammo",
    priceGp: 3,
    quantity: 20,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
  }),

  // ─── Bow coatings ───
  entry({
    name: "Power Coating",
    priceGp: 1,
    quantity: 1,
    category: "Bow",
    weight: "1/4 lb.",
  }),
  entry({
    name: "Close Range Coating",
    priceGp: 1,
    quantity: 1,
    category: "Bow",
    weight: "1/4 lb.",
  }),
  entry({
    name: "Fire Coating",
    priceGp: 2,
    quantity: 1,
    category: "Bow",
    weight: "1/4 lb.",
  }),
  entry({
    name: "Cold Coating",
    priceGp: 2,
    quantity: 1,
    category: "Bow",
    weight: "1/4 lb.",
  }),
  entry({
    name: "Lightning Coating",
    priceGp: 2,
    quantity: 1,
    category: "Bow",
    weight: "1/4 lb.",
  }),
  entry({
    name: "Acid Coating",
    priceGp: 2,
    quantity: 1,
    category: "Bow",
    weight: "1/4 lb.",
  }),

  // ─── Dual Repeaters magazines ───
  entry({
    name: "Normal Magazine",
    priceGp: 2,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Blaze Magazine",
    priceGp: 5,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Cryo Magazine",
    priceGp: 5,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Storm Magazine",
    priceGp: 5,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Slime Magazine",
    priceGp: 5,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Blaze Magazine Upgrade I",
    priceGp: 15,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Cryo Magazine Upgrade I",
    priceGp: 15,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Storm Magazine Upgrade I",
    priceGp: 15,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Slime Magazine Upgrade I",
    priceGp: 15,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Dawnstar Magazine",
    priceGp: 20,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
  entry({
    name: "Twilight Magazine",
    priceGp: 20,
    quantity: 1,
    category: "Magazine (Repeaters)",
    weight: "0.5 lb.",
  }),
];

/**
 * AGMH Ammo Vendor rows with no matching Foundry weapon-resource pack.
 * Kept so the shop still lists classic AGMH inventory.
 */
export const AMMO_VENDOR_SHOP_ONLY: WeaponResourcePriceDef[] = [
  entry({
    name: "Recover Ammo",
    priceGp: 7,
    quantity: 1,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 4",
    shopName: "Recover lvl 2 (1)",
  }),
  entry({
    name: "Tranq Ammo",
    priceGp: 50,
    quantity: 1,
    category: "Bowgun Ammo",
    weight: "1.5 lb.",
    extra: "Max 20",
  }),
  entry({
    name: "Pierce Ammo",
    priceGp: 3,
    quantity: 20,
    category: "Heavy Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
    shopName: "Pierce lvl 2 (20)",
  }),
  entry({
    name: "Pierce Ammo",
    priceGp: 4,
    quantity: 20,
    category: "Heavy Bowgun",
    weight: "1.5 lb.",
    extra: "Max 20",
    shopName: "Pierce lvl 3 (20)",
  }),
  entry({
    name: "Armor Ammo",
    priceGp: 8,
    quantity: 1,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 5",
  }),
  entry({
    name: "Demon Ammo",
    priceGp: 8,
    quantity: 1,
    category: "Light Bowgun",
    weight: "1.5 lb.",
    extra: "Max 5",
  }),
  entry({
    name: "Arrows",
    priceGp: 1,
    quantity: 20,
    category: "Bow",
    weight: "1 lb.",
  }),
];

export function formatWeaponResourceShopCost(
  def: WeaponResourcePriceDef,
): string {
  return `${def.priceGp.toLocaleString("en-US")} gp`;
}

export function toAmmoVendorShopEntry(def: WeaponResourcePriceDef): ShopEntry {
  const name =
    def.shopName ?? `${def.name} (${def.quantity})`;
  return {
    name,
    category: def.category,
    cost: formatWeaponResourceShopCost(def),
    weight: def.weight,
    ...(def.extra ? { extra: def.extra } : {}),
  };
}

/** Lookup Foundry pack price by exact item name + category (disambiguates Pierce). */
export function lookupWeaponResourcePrice(
  name: string,
  category?: string,
): WeaponResourcePriceDef | undefined {
  const matches = WEAPON_RESOURCE_PRICES.filter((d) => d.name === name);
  if (matches.length === 0) return undefined;
  if (category) {
    const byCat = matches.find((d) => d.category === category);
    if (byCat) return byCat;
  }
  return matches[0];
}

/**
 * Ammo Vendor sections built from the canonical table + AGMH shop-only rows.
 * Order: shared bowgun → HBG → LBG → Bow coatings/arrows → Magazines.
 */
export function buildAmmoVendorSections(): {
  caption: string;
  entries: ShopEntry[];
}[] {
  const ammoAndCoatings = [
    ...WEAPON_RESOURCE_PRICES.filter(
      (d) => d.category !== "Magazine (Repeaters)",
    ),
    ...AMMO_VENDOR_SHOP_ONLY,
  ];

  // Stable-ish AGMH-like order within Ammo: Bowgun shared, HBG, LBG, Bow.
  const categoryOrder = [
    "Bowgun Ammo",
    "Heavy Bowgun",
    "Light Bowgun",
    "Bow",
  ];
  ammoAndCoatings.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category);
    const bi = categoryOrder.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    const an = a.shopName ?? a.name;
    const bn = b.shopName ?? b.name;
    return an.localeCompare(bn);
  });

  const magazines = WEAPON_RESOURCE_PRICES.filter(
    (d) => d.category === "Magazine (Repeaters)",
  );

  return [
    {
      caption: "Ammo & Coatings",
      entries: ammoAndCoatings.map(toAmmoVendorShopEntry),
    },
    {
      caption: "Magazines (Dual Repeaters)",
      entries: magazines.map(toAmmoVendorShopEntry),
    },
  ];
}
