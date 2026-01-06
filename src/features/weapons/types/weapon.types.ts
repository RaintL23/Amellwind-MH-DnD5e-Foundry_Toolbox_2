/**
 * Type definitions for Hunter Weapons
 * Based on Amellwind's Guide to Monster Hunting
 */

export interface HunterWeapon {
  name: string;
  source: string;
  page?: number;
  type: "HW"; // Hunter Weapon
  rarity: string; // "none" means it has multiple rarities
  weight?: number;
  dmg1?: string; // Primary damage die
  dmg2?: string; // Secondary damage die (for versatile weapons)
  dmgType?: string; // S (Slashing), P (Piercing), B (Bludgeoning)
  property?: string[]; // Weapon properties (H, 2H, F, L, etc.)
  ac?: number; // AC bonus if applicable
  value?: number; // Cost in copper pieces
  entries?: Entry[]; // Description and rarity table
}

export type Entry = string | ComplexEntry;

export interface ComplexEntry {
  type: string;
  name?: string;
  entries?: Entry[];
  colLabels?: string[];
  colStyles?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows?: any[][];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface RarityColumnData {
  label: string; // Column label
  value: string; // Extracted value (plain text or features string)
}

export interface RarityInfo {
  rarity: string; // Common, Uncommon, Rare, Very Rare, Legendary
  slots: string; // Number of decoration slots
  bonus: string; // Attack/AC bonus
  additionalColumns: RarityColumnData[]; // Dynamic columns from the table
}

export interface OptionalFeature {
  name: string;
  source: string;
  page?: number;
  featureType?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prerequisite?: any[];
  entries: Entry[];
}

export interface WeaponData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _meta?: any;
  item?: HunterWeapon[];
  optionalfeature?: OptionalFeature[];
}

export interface ParsedFeature {
  name: string;
  source: string;
  description?: string;
}
