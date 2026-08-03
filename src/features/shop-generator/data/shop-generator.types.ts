export type ShopPriceTier = "cheap" | "normal" | "expensive";

export type ShopTierId = 1 | 2 | 3 | 4;

export type PriceSourceKind = "csv" | "catalog" | "estimated" | "generic";

export type ShopThemeId =
  | "general"
  | "blacksmith"
  | "alchemist"
  | "arcane"
  | "temple"
  | "adventuring"
  | "black-market";

export interface ShopConfig {
  itemCount: number;
  shopTier: ShopTierId;
  themeId: ShopThemeId;
  sources: string[];
  types: string[];
  rarities: string[];
  magicFilter: "" | "mundane" | "magic";
  attunementFilter: "" | "yes" | "no";
  classAffinities: string[];
}

export interface Shopkeeper {
  name: string;
  title: string;
  flavor: string;
}

export interface ShopStockEntry {
  /** Stable row id for edits/replace (not the DndItem id alone). */
  rowId: string;
  itemId: string;
  name: string;
  source: string;
  typeLabel: string;
  rarity: string;
  rarityLabel: string;
  /** Catalog/CSV base price in gp before shop markup. */
  basePriceGp: number;
  priceSource: PriceSourceKind;
  /** Manual override in gp after markup; when set, markup changes ignore this row. */
  priceOverrideGp: number | null;
}

export interface GeneratedShop {
  name: string;
  themeId: ShopThemeId;
  shopTier: ShopTierId;
  shopkeeper: Shopkeeper;
  stock: ShopStockEntry[];
  generatedAt: string;
}

export interface ShopGeneratorPersistedState {
  config: ShopConfig;
  priceTier: ShopPriceTier;
  shop: GeneratedShop | null;
}

export const PRICE_TIER_MULTIPLIERS: Record<ShopPriceTier, number> = {
  cheap: 0.75,
  normal: 1,
  expensive: 1.5,
};

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  itemCount: 12,
  shopTier: 1,
  themeId: "general",
  sources: [],
  types: [],
  rarities: [],
  magicFilter: "",
  attunementFilter: "",
  classAffinities: [],
};
