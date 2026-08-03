import type { StatBlockContent } from "./statblock-content.types";

export type DndItemRarity =
  | "none"
  | "common"
  | "uncommon"
  | "rare"
  | "very rare"
  | "legendary"
  | "artifact"
  | "varies"
  | "unknown"
  | string;

export interface DndItem {
  id: string;
  name: string;
  source: string;
  page?: number;
  rarity: DndItemRarity;
  rarityLabel: string;
  typeCode?: string;
  typeLabel: string;
  isMundane: boolean;
  isMagic: boolean;
  isItemGroup: boolean;
  isBaseItem: boolean;
  isGenericVariant: boolean;
  isSpecificVariant: boolean;
  attunement: string | null;
  weight: string | null;
  valueGp: string | null;
  valueCp: number | null;
  /**
   * Mundane base item cost in copper (from specific-variant `_baseValue`).
   * Used when Magic Item Pricing notes say to add weapon/armor/ammo cost.
   */
  baseValueCp: number | null;
  /**
   * Structured 5etools entries: attached rule text (type / properties /
   * mastery / type-additional) followed by the item's own entries.
   */
  description: StatBlockContent[];
  searchText: string;
  category: string;
  groupItemRefs?: string[];
  baseItemRef?: string;
  variantName?: string;
  baseName?: string;
  bonusWeapon?: string;
  bonusAc?: string;
  damage?: string | null;
  /** Templated property summary (e.g. "Ammunition (Range 80/320 ft.; Bolt)"). */
  properties?: string | null;
  /** Weapon Mastery property label(s) from XPHB (e.g. "Slow"); absent on 2014 weapons. */
  mastery?: string | null;
  /** Weapon range, e.g. "80/320 ft." */
  range?: string | null;
  /** Resolved ammunition label, e.g. "Bolt". */
  ammoType?: string | null;
  /** Armor/shield AC text, e.g. "11" or "+2". */
  armorClass?: string | null;
  /** Stealth note when the armor imposes disadvantage. */
  stealth?: string | null;
  /** Minimum Strength score required to wear without speed penalty. */
  strengthRequirement?: string | null;
  /** simple / martial from items-base (weapons only). */
  weaponCategory?: "simple" | "martial";
  /** Fuentes adicionales con el mismo nombre (solo en lista deduplicada) */
  variantSources?: string[];
  variantCount?: number;
}
