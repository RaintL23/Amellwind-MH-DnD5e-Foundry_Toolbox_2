import { useState } from "react";
import { Store } from "lucide-react";
import { SHOPS } from "../data/shops.data";
import { useItemDescMap } from "../hooks/useItemDescMap";
import { countShopItems, useShopSearch } from "../hooks/useShopSearch";
import { CartDrawer } from "./CartDrawer";
import { SearchInput } from "./SearchInput";
import { ShopSearchResultsPanel } from "./ShopSearchResultsPanel";
import { ShopTab } from "./ShopTab";
import { ShopTabBar } from "./ShopTabBar";

export function ShopList() {
  const itemDescMap = useItemDescMap();
  const [activeTab, setActiveTab] = useState<string>(SHOPS[0]?.id ?? "");
  const [search, setSearch] = useState("");

  const isSearching = search.trim().length > 0;
  const searchGroups = useShopSearch(search);
  const activeShop = SHOPS.find((shop) => shop.id === activeTab) ?? SHOPS[0];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearch("");
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
        onChange={setSearch}
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
