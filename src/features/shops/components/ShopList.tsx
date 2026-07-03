import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Store } from "lucide-react";
import { SHOPS } from "../data/shops.data";
import { useItemDescMap } from "../hooks/useItemDescMap";
import { countShopItems, useShopSearch } from "../hooks/useShopSearch";
import { CartDrawer } from "./CartDrawer";
import { SearchInput } from "./SearchInput";
import { ShopSearchResultsPanel } from "./ShopSearchResultsPanel";
import { ShopTab } from "./ShopTab";
import { ShopTabBar } from "./ShopTabBar";
import { setIfPresent } from "@/shared/utils/list-url-params.utils";

export function ShopList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const itemDescMap = useItemDescMap();
  const defaultShopId = SHOPS[0]?.id ?? "";
  const activeTab = searchParams.get("shop") ?? defaultShopId;
  const search = searchParams.get("q") ?? "";

  const patchUrl = useCallback(
    (patch: { q?: string; shop?: string }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          const q = "q" in patch ? (patch.q ?? "") : (prev.get("q") ?? "");
          const shop =
            "shop" in patch
              ? (patch.shop ?? defaultShopId)
              : (prev.get("shop") ?? defaultShopId);
          setIfPresent(next, "q", q);
          if (shop && shop !== defaultShopId) next.set("shop", shop);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaultShopId],
  );

  const isSearching = search.trim().length > 0;
  const searchGroups = useShopSearch(search);
  const activeShop = SHOPS.find((shop) => shop.id === activeTab) ?? SHOPS[0];

  const handleTabChange = (id: string) => {
    patchUrl({ shop: id, q: "" });
  };

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Store className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Shops</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {SHOPS.length} shops · {countShopItems()} items available in the
          Monster Hunter world.
        </p>
      </div>

      <SearchInput
        value={search}
        onChange={(q) => patchUrl({ q })}
        placeholder="Search items across all shops…"
      />

      {isSearching ? (
        <ShopSearchResultsPanel
          groups={searchGroups}
          query={search}
          itemDescMap={itemDescMap}
        />
      ) : (
        <>
          <ShopTabBar
            shops={SHOPS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          {activeShop && (
            <ShopTab shop={activeShop} itemDescMap={itemDescMap} />
          )}
        </>
      )}

      <CartDrawer />
    </div>
  );
}
