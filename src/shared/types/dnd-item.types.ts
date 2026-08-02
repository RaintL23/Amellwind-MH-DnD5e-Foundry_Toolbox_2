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
  /** Structured 5etools entries (paragraphs, lists, tables, named sections). */
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
  properties?: string | null;
  /** simple / martial from items-base (weapons only). */
  weaponCategory?: "simple" | "martial";
  /** Fuentes adicionales con el mismo nombre (solo en lista deduplicada) */
  variantSources?: string[];
  variantCount?: number;
}
