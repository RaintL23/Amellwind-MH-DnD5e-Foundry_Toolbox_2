import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { MHItem } from "@/shared/types";
import { useItems } from "../hooks/useItems";
import { useItemSearch } from "../hooks/useItemSearch";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { CartDrawer } from "./CartDrawer";
import { ItemDetailPanel } from "./ItemDetailPanel";
import { ItemSearchResultsPanel } from "./ItemSearchResultsPanel";
import { ItemsTable } from "./ItemsTable";
import { ItemTabBar } from "./ItemTabBar";
import { SearchInput } from "./SearchInput";
import { setIfPresent } from "@/shared/utils/list-url-params.utils";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";

export function ItemList() {
  const { items, loading, uniqueTypes } = useItems();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<MHItem | null>(null);
  const { value: itemParam, setValue: setItemParam } = useListItemUrlParam("item");

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
          const item = prev.get("item");
          if (item) next.set("item", item);
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
  };

  const handleSelect = useCallback(
    (item: MHItem | null) => {
      setSelected(item);
      setItemParam(item?.name ?? null);
    },
    [setItemParam],
  );

  const handleClose = useCallback(() => {
    setSelected(null);
    setItemParam(null);
  }, [setItemParam]);

  useEffect(() => {
    if (!itemParam) {
      setSelected(null);
      return;
    }
    if (loading) return;
    const found = items.find(
      (item) => item.name.toLowerCase() === itemParam.toLowerCase(),
    );
    if (found) setSelected(found);
  }, [itemParam, items, loading]);

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
          onSelect={handleSelect}
        />
      ) : (
        <>
          <ItemTabBar
            types={uniqueTypes}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <ItemsTable
            items={tabItems}
            selected={selected}
            onSelect={handleSelect}
          />
        </>
      )}

      {selected && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={handleClose}
            aria-hidden
          />
          <ItemDetailPanel item={selected} onClose={handleClose} />
        </>
      )}

      <CartDrawer />
    </div>
  );
}
