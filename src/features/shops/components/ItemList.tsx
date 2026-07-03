import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { MHItem } from "@/shared/types";
import { useItems } from "../hooks/useItems";
import { useItemSearch } from "../hooks/useItemSearch";
import { CartDrawer } from "./CartDrawer";
import { ItemDetailPanel } from "./ItemDetailPanel";
import { ItemSearchResultsPanel } from "./ItemSearchResultsPanel";
import { ItemsTab } from "./ItemsTab";
import { ItemTabBar } from "./ItemTabBar";
import { SearchInput } from "./SearchInput";
import { setIfPresent } from "@/shared/utils/list-url-params.utils";

export function ItemList() {
  const { items, loading, uniqueTypes } = useItems();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<MHItem | null>(null);

  const search = searchParams.get("q") ?? "";
  const defaultType = uniqueTypes[0] ?? "";
  const activeTab = searchParams.get("type") ?? defaultType;

  const patchUrl = (patch: { q?: string; type?: string }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        const q = "q" in patch ? (patch.q ?? "") : (prev.get("q") ?? "");
        const type =
          "type" in patch
            ? (patch.type ?? defaultType)
            : (prev.get("type") ?? defaultType);
        setIfPresent(next, "q", q);
        if (type && type !== defaultType) next.set("type", type);
        return next;
      },
      { replace: true },
    );
  };

  const isSearching = search.trim().length > 0;
  const searchResults = useItemSearch(items, search);

  const tabItems = useMemo(
    () => items.filter((item) => item.typeLabel === activeTab),
    [items, activeTab],
  );

  const handleTabChange = (tab: string) => {
    patchUrl({ type: tab, q: "" });
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">Loading items…</div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Package className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Items</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {items.length} AGMH items across {uniqueTypes.length} types.
        </p>
      </div>

      <SearchInput
        value={search}
        onChange={(q) => patchUrl({ q })}
        placeholder="Search items by name…"
      />

      {isSearching ? (
        <ItemSearchResultsPanel
          results={searchResults}
          query={search}
          selected={selected}
          onSelect={setSelected}
        />
      ) : (
        <>
          <ItemTabBar
            types={uniqueTypes}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <ItemsTab
            items={tabItems}
            selected={selected}
            onSelect={setSelected}
          />
        </>
      )}

      {selected && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <ItemDetailPanel item={selected} onClose={() => setSelected(null)} />
        </>
      )}

      <CartDrawer />
    </div>
  );
}
