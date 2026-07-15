export interface WeaponRarityRow {
  rarity: string;
  slots: number;
  /** Todas las columnas a partir de índice 2, mapeadas por label del colLabels */
  columns: Record<string, string | string[]>;
}

export type WeaponContentSource = "amellwind" | "dnd";

export interface Weapon {
  /** Stable id for D&D catalog variants (`name|source`). */
  id?: string;
  name: string;
  source: string;
  /** Defaults to Amellwind MH when omitted (legacy GTMH weapons). */
  contentSource?: WeaponContentSource;
  /** D&D 5e simple/martial category from items-base.json. */
  weaponCategory?: "simple" | "martial";
  page?: number;
  dmg1: string;
  dmg2?: string;
  dmgType: string;
  properties: string[];
  weight: number;
  valueCp: number;
  acBonus?: number;
  /** Weapon includes an integrated shield (source `ac` field). */
  includesShield?: boolean;
  range?: string;
  isFocus?: boolean;
  description: string;
  /** Extra paragraphs from weapon entries (shield notes, AC rules, etc.). */
  supplementaryNotes: string[];
  rarityRows: WeaponRarityRow[];
  /**
   * Names of features referenced via {@optfeature} in the weapon description.
   * These are "base features" that apply at all rarities (e.g. Melody and
   * Single Note Melody on the Hunting Horn).
   */
  baseFeatureNames: string[];
  /** 5etools ammoType uid, e.g. arrow|phb */
  ammoType?: string;
  /** Foundry weapon mastery key (e.g. "vex", "topple"); from 2024 base weapons. */
  mastery?: string;
  /** Normalized rarity label for D&D filters and badges. */
  itemRarityLabel?: string;
  /** Base item name for magic variants (e.g. Glaive for Silvered Glaive). */
  baseName?: string;
  /** Set on grouped catalog rows when the same name exists in multiple sources. */
  variantSources?: string[];
}

export const PROPERTY_LABELS: Record<string, string> = {
  H: "Heavy",
  "2H": "Two-Handed",
  F: "Finesse",
  L: "Light",
  R: "Reach",
  V: "Versatile",
  A: "Ammunition",
  S: "Special",
  T: "Thrown",
  /** AGMH bowgun property — replaces the standard 5e Loading property. */
  MHL: "Loading",
  LD: "Loading",
};

/** Descriptions for MH-specific weapon properties (from GTMH `itemProperty`). */
export const PROPERTY_DESCRIPTIONS: Record<string, string> = {
  MHL: "As a bonus action you switch the ammo your bowgun is using with another. This replaces the standard 5e loading property.",
};

export const DMG_TYPE_LABELS: Record<string, string> = {
  S: "Slashing",
  P: "Piercing",
  B: "Bludgeoning",
};

export const RARITY_ORDER = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"] as const;

export type RarityTier = (typeof RARITY_ORDER)[number];

export const RARITY_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  Common: {
    border: "border-gray-600",
    bg: "from-gray-900 to-gray-800",
    text: "text-gray-200",
    badge: "bg-gray-700/60 text-gray-300 border-gray-600",
  },
  Uncommon: {
    border: "border-green-700",
    bg: "from-green-950 to-green-900",
    text: "text-green-200",
    badge: "bg-green-900/60 text-green-300 border-green-700",
  },
  Rare: {
    border: "border-blue-700",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-200",
    badge: "bg-blue-900/60 text-blue-300 border-blue-700",
  },
  "Very Rare": {
    border: "border-purple-700",
    bg: "from-purple-950 to-purple-900",
    text: "text-purple-200",
    badge: "bg-purple-900/60 text-purple-300 border-purple-700",
  },
  Legendary: {
    border: "border-amber-600",
    bg: "from-amber-950 to-amber-900",
    text: "text-amber-200",
    badge: "bg-amber-900/60 text-amber-300 border-amber-600",
  },
};

export const DMG_TYPE_COLOR: Record<string, string> = {
  S: "border-red-800/60 hover:border-red-700",
  P: "border-blue-800/60 hover:border-blue-700",
  B: "border-orange-800/60 hover:border-orange-700",
};

export const FEATURE_COL_KEYS = [
  "features",
  "single features",
  "splint features",
  "notes",
  "ammo",
  "coatings",
  "phials",
  "available",
];

/** Item lists parsed from trailing nested tables (ammo types, coatings, etc.) */
export const UNLOCK_COLUMN_PREFIX = "Unlocked ";

export function isWeaponFeatureColumn(label: string): boolean {
  const lower = label.toLowerCase();
  if (lower.startsWith(UNLOCK_COLUMN_PREFIX.toLowerCase())) return false;
  return FEATURE_COL_KEYS.some((k) => lower.includes(k));
}

export function isUnlockListColumn(label: string): boolean {
  return label.toLowerCase().startsWith(UNLOCK_COLUMN_PREFIX.toLowerCase());
}
