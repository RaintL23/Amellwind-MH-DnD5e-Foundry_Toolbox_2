import {
  DEFAULT_SHOP_CONFIG,
  type GeneratedShop,
  type ShopConfig,
  type ShopGeneratorPersistedState,
  type ShopPriceTier,
  type ShopStockEntry,
  type ShopThemeId,
  type ShopTierId,
} from "../data/shop-generator.types";

const STORAGE_KEY = "mh-shop-generator";

export const DEFAULT_SHOP_GENERATOR_STATE: ShopGeneratorPersistedState = {
  config: { ...DEFAULT_SHOP_CONFIG },
  priceTier: "normal",
  shop: null,
};

function isShopTierId(value: unknown): value is ShopTierId {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isThemeId(value: unknown): value is ShopThemeId {
  return (
    value === "general" ||
    value === "blacksmith" ||
    value === "alchemist" ||
    value === "arcane" ||
    value === "temple" ||
    value === "adventuring" ||
    value === "black-market"
  );
}

function isPriceTier(value: unknown): value is ShopPriceTier {
  return value === "cheap" || value === "normal" || value === "expensive";
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function parseConfig(raw: unknown): ShopConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SHOP_CONFIG };
  const c = raw as Partial<ShopConfig>;
  const itemCount =
    typeof c.itemCount === "number" && Number.isFinite(c.itemCount)
      ? Math.min(40, Math.max(1, Math.round(c.itemCount)))
      : DEFAULT_SHOP_CONFIG.itemCount;

  return {
    itemCount,
    shopTier: isShopTierId(c.shopTier) ? c.shopTier : DEFAULT_SHOP_CONFIG.shopTier,
    themeId: isThemeId(c.themeId) ? c.themeId : DEFAULT_SHOP_CONFIG.themeId,
    sources: parseStringArray(c.sources),
    types: parseStringArray(c.types),
    rarities: parseStringArray(c.rarities),
    magicFilter:
      c.magicFilter === "mundane" || c.magicFilter === "magic"
        ? c.magicFilter
        : "",
    attunementFilter:
      c.attunementFilter === "yes" || c.attunementFilter === "no"
        ? c.attunementFilter
        : "",
    classAffinities: parseStringArray(c.classAffinities),
  };
}

function parseStockEntry(raw: unknown): ShopStockEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Partial<ShopStockEntry>;
  if (
    typeof e.rowId !== "string" ||
    typeof e.itemId !== "string" ||
    typeof e.name !== "string" ||
    typeof e.basePriceGp !== "number"
  ) {
    return null;
  }
  return {
    rowId: e.rowId,
    itemId: e.itemId,
    name: e.name,
    source: typeof e.source === "string" ? e.source : "",
    typeLabel: typeof e.typeLabel === "string" ? e.typeLabel : "—",
    rarity: typeof e.rarity === "string" ? e.rarity : "unknown",
    rarityLabel: typeof e.rarityLabel === "string" ? e.rarityLabel : "Unknown",
    basePriceGp: e.basePriceGp,
    priceSource:
      e.priceSource === "csv" ||
      e.priceSource === "catalog" ||
      e.priceSource === "estimated" ||
      e.priceSource === "generic"
        ? e.priceSource
        : "estimated",
    priceOverrideGp:
      typeof e.priceOverrideGp === "number" ? e.priceOverrideGp : null,
  };
}

function parseShop(raw: unknown): GeneratedShop | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<GeneratedShop>;
  if (typeof s.name !== "string" || !s.shopkeeper || typeof s.shopkeeper !== "object") {
    return null;
  }
  const sk = s.shopkeeper as Partial<GeneratedShop["shopkeeper"]>;
  if (
    typeof sk.name !== "string" ||
    typeof sk.title !== "string" ||
    typeof sk.flavor !== "string"
  ) {
    return null;
  }
  const stock = Array.isArray(s.stock)
    ? s.stock.map(parseStockEntry).filter((e): e is ShopStockEntry => e != null)
    : [];

  return {
    name: s.name,
    themeId: isThemeId(s.themeId) ? s.themeId : "general",
    shopTier: isShopTierId(s.shopTier) ? s.shopTier : 1,
    shopkeeper: {
      name: sk.name,
      title: sk.title,
      flavor: sk.flavor,
    },
    stock,
    generatedAt:
      typeof s.generatedAt === "string"
        ? s.generatedAt
        : new Date().toISOString(),
  };
}

export function loadShopGeneratorState(): ShopGeneratorPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHOP_GENERATOR_STATE, config: { ...DEFAULT_SHOP_CONFIG } };

    const parsed = JSON.parse(raw) as Partial<ShopGeneratorPersistedState>;
    return {
      config: parseConfig(parsed.config),
      priceTier: isPriceTier(parsed.priceTier)
        ? parsed.priceTier
        : DEFAULT_SHOP_GENERATOR_STATE.priceTier,
      shop: parseShop(parsed.shop),
    };
  } catch {
    return { ...DEFAULT_SHOP_GENERATOR_STATE, config: { ...DEFAULT_SHOP_CONFIG } };
  }
}

export function persistShopGeneratorState(
  state: ShopGeneratorPersistedState,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage unavailable */
  }
}
