/** Raw 5etools item shapes (items.json, items-base.json, magicvariants.json). */

export interface CopyRef {
  name?: string;
  source?: string;
  abbreviation?: string;
  _preserve?: Record<string, boolean>;
}

export interface RawItemEntity {
  name: string;
  source: string;
  page?: number;
  type?: string;
  rarity?: string;
  value?: number;
  weight?: number | string;
  entries?: unknown[];
  additionalEntries?: unknown[];
  reqAttune?: boolean | string;
  reqAttuneTags?: unknown[];
  baseItem?: string;
  _copy?: CopyRef;
  _isItemGroup?: boolean;
  _isBaseItem?: boolean;
  _category?: string;
  _baseName?: string;
  _baseSource?: string;
  _variantName?: string;
  _baseValue?: number;
  items?: string[];
  packContents?: unknown;
  edition?: string | null;
  noDisplay?: boolean;
  property?: unknown[];
  /** Weapon Mastery UIDs from XPHB (e.g. `["Slow|XPHB"]`). */
  mastery?: unknown[];
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  range?: string;
  ammoType?: string;
  reload?: number | string;
  ac?: number;
  stealth?: boolean;
  strength?: number | string;
  bonusWeapon?: string;
  bonusAc?: string;
  armor?: boolean;
  weapon?: boolean;
  weaponCategory?: "simple" | "martial";
  wondrous?: boolean;
  [key: string]: unknown;
}

export interface ItemsJson {
  _meta?: { internalCopies?: string[] };
  item: RawItemEntity[];
  itemGroup?: RawItemEntity[];
}

export interface RawItemType {
  name?: string;
  abbreviation: string;
  source: string;
  page?: number;
  entries?: unknown[];
  _copy?: CopyRef;
}

export interface RawItemProperty {
  abbreviation: string;
  source?: string;
  name?: string;
  template?: string;
  entries?: unknown[];
}

export interface RawItemMastery {
  name: string;
  source: string;
  page?: number;
  entries?: unknown[];
}

export interface RawItemTypeAdditionalEntries {
  name?: string;
  source: string;
  appliesTo: string;
  entries: unknown[];
}

export interface RawItemEntry {
  name: string;
  source: string;
  entriesTemplate?: unknown[];
}

export interface ItemsBaseJson {
  _meta?: { internalCopies?: string[] };
  baseitem: RawItemEntity[];
  itemType?: RawItemType[];
  itemProperty?: RawItemProperty[];
  itemTypeAdditionalEntries?: RawItemTypeAdditionalEntries[];
  itemEntry?: RawItemEntry[];
  itemMastery?: RawItemMastery[];
}

export interface RawMagicVariant {
  name: string;
  source?: string;
  type?: string;
  edition?: string | null;
  requires: Array<Record<string, unknown>>;
  excludes?: Record<string, unknown>;
  inherits: Record<string, unknown>;
  entries?: unknown[];
  ammo?: boolean;
  _isInherited?: boolean;
  [key: string]: unknown;
}

export interface MagicVariantsJson {
  magicvariant: RawMagicVariant[];
  linkedLootTables?: Record<string, unknown>;
}

export interface ItemTypeIndexEntry {
  abbreviation: string;
  source: string;
  name?: string;
  entries?: unknown[];
}

export interface ItemPropertyIndexEntry {
  abbreviation: string;
  source?: string;
  name?: string;
  template?: string;
  entries?: unknown[];
}

export interface ItemMasteryIndexEntry {
  name: string;
  source: string;
  entries?: unknown[];
}

export interface ItemBaseIndexes {
  itemTypes: Map<string, ItemTypeIndexEntry>;
  itemProperties: Map<string, ItemPropertyIndexEntry>;
  itemMasteries: Map<string, ItemMasteryIndexEntry>;
  itemTypeAdditionalEntries: RawItemTypeAdditionalEntries[];
  /** name|source and name-only → entriesTemplate */
  itemEntries: Map<string, unknown[]>;
}
