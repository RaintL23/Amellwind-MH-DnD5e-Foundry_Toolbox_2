export interface WeaponRarityRow {
  rarity: string;
  slots: number;
  /** Todas las columnas a partir de índice 2, mapeadas por label del colLabels */
  columns: Record<string, string | string[]>;
}

export type WeaponContentSource = "amellwind" | "dnd";

/** Martial / Simple classification from the AGMH Player's Guide table. */
export type WeaponProficiencyTier = "martial" | "simple" | "martial-or-simple";
/** Melee vs ranged classification from the Player's Guide table. */
export type WeaponProficiencyRange = "melee" | "ranged";

/**
 * D&D weapon proficiencies compatible with an MH / forge weapon.
 * When set on a Weapon, overrides the static name lookup in WEAPON_PROFICIENCIES.
 */
export interface WeaponProficiencyRule {
  /** Any one of these PHB proficiencies grants MH weapon proficiency. */
  compatible: string[];
  /** Also requires shield proficiency (integrated shield weapons). */
  requiresShield?: boolean;
  /** Martial / Simple classification from the Player's Guide table. */
  tier: WeaponProficiencyTier;
  /** Melee vs ranged classification from the Player's Guide table. */
  range: WeaponProficiencyRange;
}

/**
 * Alternate combat stance for MH switch weapons (Switch Axe, Charge Blade, etc.).
 * Distinct from PHB Versatile (`V` + `dmg2`): modes have their own labels and grip rules.
 */
export interface WeaponModeDef {
  label: string;
  damage: string;
  /** Override weapon-level `dmgType` for this stance (`S` / `P` / `B`). */
  dmgType?: string;
  hasShield?: boolean;
  isTwoHanded?: boolean;
  blocksOffHand?: boolean;
}

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
  /**
   * Named combat modes (Switch Axe axe/sword, Charge Blade, etc.).
   * When set, overrides hardcoded switch-mode tables. Not used for Versatile (V).
   */
  modes?: WeaponModeDef[];
  dmgType: string;
  properties: string[];
  weight: number;
  valueCp: number;
  acBonus?: number;
  /** Weapon includes an integrated shield (source `ac` field). */
  includesShield?: boolean;
  /**
   * Compatible D&D proficiency rule (Weapon Forge / curated `_raintdm.proficiency`).
   * When absent, UI falls back to the static AGMH name table.
   */
  proficiency?: WeaponProficiencyRule;
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

/** Pre-rarity tier for weapon-wide features (Switch Mode, Melody, Loading, …). */
export const BASE_RARITY = "Base";

/** Weapon progression including Base, then Amellwind D&D rarities. */
export const WEAPON_RARITY_ORDER = [BASE_RARITY, ...RARITY_ORDER] as const;

export type WeaponRarityTier = (typeof WEAPON_RARITY_ORDER)[number];

export function isBaseRarity(rarity: string): boolean {
  return rarity.trim().toLowerCase() === BASE_RARITY.toLowerCase();
}

export function isWeaponRarityTier(value: string): value is WeaponRarityTier {
  return (WEAPON_RARITY_ORDER as readonly string[]).includes(value);
}

export function defaultSlotsForWeaponRarity(rarity: string): number {
  if (isBaseRarity(rarity)) return 0;
  const idx = RARITY_ORDER.indexOf(rarity as RarityTier);
  if (idx >= 0) return idx + 1;
  return 1;
}

export const RARITY_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  Base: {
    border: "border-slate-500",
    bg: "from-slate-950 to-slate-900",
    text: "text-slate-100",
    badge: "bg-slate-800/70 text-slate-200 border-slate-500",
  },
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

/** Known feature / resource unlock column name fragments (legacy detection). */
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

/** Combat stat columns: "Bonus", "Bonus to Hit", "Bonus AC", "AC Bonus", … */
export function isWeaponStatBonusColumn(label: string): boolean {
  const lower = label.toLowerCase().trim();
  return (
    lower === "bonus" ||
    lower.startsWith("bonus ") ||
    lower.endsWith(" bonus")
  );
}

/** Rarity-table AC column, whether labeled "AC Bonus" (AGMH) or "Bonus AC" (forge). */
export function isWeaponAcBonusColumn(label: string): boolean {
  const lower = label.toLowerCase().trim();
  return lower === "ac bonus" || lower === "bonus ac";
}

/**
 * Feature and weapon-resource unlock columns on a rarity row.
 * Excludes Bonus* / *Bonus stats and nested "Unlocked …" lists. Any other
 * column (including custom forge resource names) is treated as a feature list.
 */
export function isWeaponFeatureColumn(label: string): boolean {
  const lower = label.toLowerCase();
  if (lower.startsWith(UNLOCK_COLUMN_PREFIX.toLowerCase())) return false;
  if (isWeaponStatBonusColumn(label)) return false;
  return true;
}

export function isUnlockListColumn(label: string): boolean {
  return label.toLowerCase().startsWith(UNLOCK_COLUMN_PREFIX.toLowerCase());
}
