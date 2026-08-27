import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Store } from "lucide-react";
import { SHOPS } from "../data/shops.data";
import { useItemDescMap } from "../hooks/useItemDescMap";
import { countShopItems, useShopSearch } from "../hooks/useShopSearch";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { CartDrawer } from "./CartDrawer";
import { SearchInput } from "./SearchInput";
import { ShopSearchResultsPanel } from "./ShopSearchResultsPanel";
import { ShopTab } from "./ShopTab";
import { ShopTabBar } from "./ShopTabBar";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";

export function ShopList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const itemDescMap = useItemDescMap();
  const defaultShopId = SHOPS[0]?.id ?? "";
  const activeTab = searchParams.get("shop") ?? defaultShopId;

  const { q, patchFilters } = useListSessionFilters({
    listId: "mh-shops",
    stringKeys: ["q"],
    multiKeys: [],
    urlPreserveKeys: ["shop"],
  });

  const commitSearchQuery = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );

  const {
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
  } = useDebouncedListSearch(q, commitSearchQuery);

  const isSearching = appliedSearch.trim().length > 0;
  const searchGroups = useShopSearch(appliedSearch);
  const activeShop = SHOPS.find((shop) => shop.id === activeTab) ?? SHOPS[0];

  const handleTabChange = (id: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id && id !== defaultShopId) next.set("shop", id);
        else next.delete("shop");
        return next;
      },
      { replace: true },
    );
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
        value={searchDraft}
        onChange={setSearchDraft}
        placeholder="Search items across all shops…"
      />

      {isSearchPending ? (
        <ListAreaLoading />
      ) : isSearching ? (
        <ShopSearchResultsPanel
          groups={searchGroups}
          query={appliedSearch}
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
