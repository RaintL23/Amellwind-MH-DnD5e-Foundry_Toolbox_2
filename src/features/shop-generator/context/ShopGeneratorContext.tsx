import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DndItem } from "@/shared/types";
import {
  getListDndItems,
  getDndItemSourceCatalog,
  preloadDndItemSources,
} from "@/features/dnd-items/services/dnd-item.service";
import { DEFAULT_DND_ITEM_SOURCES } from "@/shared/constants/api.constants";
import {
  PRICE_TIER_MULTIPLIERS,
  type GeneratedShop,
  type ShopConfig,
  type ShopPriceTier,
} from "../data/shop-generator.types";
import {
  loadShopGeneratorState,
  persistShopGeneratorState,
} from "../storage/shop-generator.storage";
import {
  applyMarkupGp,
  formatShopPriceGp,
} from "../utils/price-resolve.utils";
import {
  collectRarityValues,
  collectTypeLabels,
  createShopkeeper,
  generateShop,
  replaceStockEntry,
} from "../utils/shop-generate.utils";

interface ShopGeneratorContextValue {
  config: ShopConfig;
  priceTier: ShopPriceTier;
  shop: GeneratedShop | null;
  items: DndItem[];
  availableSources: string[];
  loadedSources: string[];
  typeOptions: string[];
  rarityOptions: string[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  patchConfig: (patch: Partial<ShopConfig>) => void;
  setPriceTier: (tier: ShopPriceTier) => void;
  setShopName: (name: string) => void;
  generate: () => Promise<void>;
  rerollShopkeeper: () => Promise<void>;
  editStockPrice: (rowId: string, priceGp: number | null) => void;
  removeStockEntry: (rowId: string) => void;
  replaceEntry: (rowId: string) => void;
  getDisplayPriceGp: (rowId: string) => number;
  getStockTotalGp: () => number;
  exportJson: () => void;
  exportText: () => void;
  ensureSourcesLoaded: (sources: string[]) => Promise<void>;
}

const ShopGeneratorContext = createContext<ShopGeneratorContextValue | null>(
  null,
);

export function ShopGeneratorProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const initial = loadShopGeneratorState();
  const [config, setConfig] = useState<ShopConfig>(initial.config);
  const [priceTier, setPriceTierState] = useState<ShopPriceTier>(
    initial.priceTier,
  );
  const [shop, setShop] = useState<GeneratedShop | null>(initial.shop);
  const [items, setItems] = useState<DndItem[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    const sourcesToLoad =
      config.sources.length > 0
        ? config.sources
        : [...DEFAULT_DND_ITEM_SOURCES];
    await preloadDndItemSources(sourcesToLoad);
    const [list, catalog] = await Promise.all([
      getListDndItems(),
      getDndItemSourceCatalog(),
    ]);
    setItems(list);
    setAvailableSources(catalog.available);
    setLoadedSources(catalog.loaded);
  }, [config.sources]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refreshCatalog()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load item catalog",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshCatalog]);

  useEffect(() => {
    persistShopGeneratorState({ config, priceTier, shop });
  }, [config, priceTier, shop]);

  const typeOptions = useMemo(() => collectTypeLabels(items), [items]);
  const rarityOptions = useMemo(() => collectRarityValues(items), [items]);

  const patchConfig = useCallback((patch: Partial<ShopConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const setPriceTier = useCallback((tier: ShopPriceTier) => {
    setPriceTierState(tier);
  }, []);

  const setShopName = useCallback((name: string) => {
    setShop((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const ensureSourcesLoaded = useCallback(async (sources: string[]) => {
    if (sources.length === 0) return;
    await preloadDndItemSources(sources);
    const [list, catalog] = await Promise.all([
      getListDndItems(),
      getDndItemSourceCatalog(),
    ]);
    setItems(list);
    setAvailableSources(catalog.available);
    setLoadedSources(catalog.loaded);
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const sources =
        config.sources.length > 0
          ? config.sources
          : [...DEFAULT_DND_ITEM_SOURCES];
      await preloadDndItemSources(sources);
      const list = await getListDndItems();
      setItems(list);
      const next = await generateShop(list, {
        ...config,
        sources: config.sources.length > 0 ? config.sources : sources,
      });
      setShop(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate shop");
    } finally {
      setGenerating(false);
    }
  }, [config]);

  const rerollShopkeeper = useCallback(async () => {
    if (!shop) return;
    const shopkeeper = await createShopkeeper(shop.themeId);
    setShop({ ...shop, shopkeeper });
  }, [shop]);

  const editStockPrice = useCallback(
    (rowId: string, priceGp: number | null) => {
      setShop((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stock: prev.stock.map((entry) =>
            entry.rowId === rowId
              ? { ...entry, priceOverrideGp: priceGp }
              : entry,
          ),
        };
      });
    },
    [],
  );

  const removeStockEntry = useCallback((rowId: string) => {
    setShop((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stock: prev.stock.filter((entry) => entry.rowId !== rowId),
      };
    });
  }, []);

  const replaceEntry = useCallback(
    (rowId: string) => {
      if (!shop) return;
      const sources =
        config.sources.length > 0
          ? config.sources
          : [...DEFAULT_DND_ITEM_SOURCES];
      const next = replaceStockEntry(
        items,
        {
          ...config,
          sources: config.sources.length > 0 ? config.sources : sources,
        },
        shop,
        rowId,
      );
      setShop(next);
    },
    [shop, items, config],
  );

  const getDisplayPriceGp = useCallback(
    (rowId: string): number => {
      const entry = shop?.stock.find((s) => s.rowId === rowId);
      if (!entry) return 0;
      if (entry.priceOverrideGp != null) return entry.priceOverrideGp;
      return applyMarkupGp(
        entry.basePriceGp,
        PRICE_TIER_MULTIPLIERS[priceTier],
      );
    },
    [shop, priceTier],
  );

  const getStockTotalGp = useCallback((): number => {
    if (!shop) return 0;
    return shop.stock.reduce(
      (sum, entry) => sum + getDisplayPriceGp(entry.rowId),
      0,
    );
  }, [shop, getDisplayPriceGp]);

  const exportJson = useCallback(() => {
    if (!shop) return;
    const payload = {
      ...shop,
      priceTier,
      stock: shop.stock.map((entry) => ({
        ...entry,
        displayPriceGp: getDisplayPriceGp(entry.rowId),
      })),
      totalGp: getStockTotalGp(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shop.name.replace(/[^\w-]+/g, "_").toLowerCase() || "shop"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [shop, priceTier, getDisplayPriceGp, getStockTotalGp]);

  const exportText = useCallback(() => {
    if (!shop) return;
    const lines = [
      shop.name,
      `Theme: ${shop.themeId} · Tier ${shop.shopTier} · Markup: ${priceTier}`,
      `Shopkeeper: ${shop.shopkeeper.name}, ${shop.shopkeeper.title}`,
      shop.shopkeeper.flavor,
      "",
      "Inventory:",
      ...shop.stock.map(
        (entry) =>
          `- ${entry.name} (${entry.rarityLabel}, ${entry.typeLabel}) — ${formatShopPriceGp(getDisplayPriceGp(entry.rowId))} [${entry.priceSource}]`,
      ),
      "",
      `Total: ${formatShopPriceGp(getStockTotalGp())}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shop.name.replace(/[^\w-]+/g, "_").toLowerCase() || "shop"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [shop, priceTier, getDisplayPriceGp, getStockTotalGp]);

  const value = useMemo<ShopGeneratorContextValue>(
    () => ({
      config,
      priceTier,
      shop,
      items,
      availableSources,
      loadedSources,
      typeOptions,
      rarityOptions,
      loading,
      generating,
      error,
      patchConfig,
      setPriceTier,
      setShopName,
      generate,
      rerollShopkeeper,
      editStockPrice,
      removeStockEntry,
      replaceEntry,
      getDisplayPriceGp,
      getStockTotalGp,
      exportJson,
      exportText,
      ensureSourcesLoaded,
    }),
    [
      config,
      priceTier,
      shop,
      items,
      availableSources,
      loadedSources,
      typeOptions,
      rarityOptions,
      loading,
      generating,
      error,
      patchConfig,
      setPriceTier,
      setShopName,
      generate,
      rerollShopkeeper,
      editStockPrice,
      removeStockEntry,
      replaceEntry,
      getDisplayPriceGp,
      getStockTotalGp,
      exportJson,
      exportText,
      ensureSourcesLoaded,
    ],
  );

  return (
    <ShopGeneratorContext.Provider value={value}>
      {children}
    </ShopGeneratorContext.Provider>
  );
}

export function useShopGenerator(): ShopGeneratorContextValue {
  const ctx = useContext(ShopGeneratorContext);
  if (!ctx) {
    throw new Error(
      "useShopGenerator must be used within ShopGeneratorProvider",
    );
  }
  return ctx;
}
