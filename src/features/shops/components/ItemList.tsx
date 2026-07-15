import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { MHItem } from "@/shared/types";
import { useItems } from "../hooks/useItems";
import { useItemSearch } from "../hooks/useItemSearch";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { CartDrawer } from "./CartDrawer";
import { ItemDetailPanel } from "./ItemDetailPanel";
import { ItemSearchResultsPanel } from "./ItemSearchResultsPanel";
import { ItemsTab } from "./ItemsTab";
import { ItemTabBar } from "./ItemTabBar";
import { SearchInput } from "./SearchInput";
import { setIfPresent } from "@/shared/utils/list-url-params.utils";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";

export function ItemList() {
  const { items, loading, uniqueTypes } = useItems();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<MHItem | null>(null);

  const search = searchParams.get("q") ?? "";
  const defaultType = uniqueTypes[0] ?? "";
  const activeTab = searchParams.get("type") ?? defaultType;

  const patchUrl = useCallback(
    (patch: { q?: string; type?: string }) => {
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
    },
    [setSearchParams, defaultType],
  );

  const commitSearchQuery = useCallback(
    (q: string) => patchUrl({ q }),
    [patchUrl],
  );

  const {
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    commitSearch,
  } = useDebouncedListSearch(search, commitSearchQuery);

  const isSearching = appliedSearch.trim().length > 0;
  const searchResults = useItemSearch(items, appliedSearch);

  const tabItems = useMemo(
    () => items.filter((item) => item.typeLabel === activeTab),
    [items, activeTab],
  );

  const handleTabChange = (tab: string) => {
    commitSearch("");
    patchUrl({ type: tab, q: "" });
    setSelected(null);
  };

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Package className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Items</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {!loading && (
            <>
              {items.length} AGMH items across {uniqueTypes.length} types.
            </>
          )}
        </p>
      </div>

      <SearchInput
        value={searchDraft}
        onChange={setSearchDraft}
        placeholder="Search items by name…"
      />

      {loading || isSearchPending ? (
        <ListAreaLoading />
      ) : isSearching ? (
        <ItemSearchResultsPanel
          results={searchResults}
          query={appliedSearch}
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
