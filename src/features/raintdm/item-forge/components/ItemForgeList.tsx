import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { setIfPresent } from "@/shared/utils/list-url-params.utils";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { ItemTabBar } from "@/features/amellwind/shops/components/ItemTabBar";
import { SearchInput } from "@/features/amellwind/shops/components/SearchInput";
import type { RaintdmItem } from "../types/item-forge.types";
import { useItemForge } from "../hooks/useItemForge";
import { useItemForgeSearch } from "../hooks/useItemForgeSearch";
import { useForgeIngredientDescMap } from "../hooks/useForgeIngredientDescMap";
import { ItemForgeDetailPanel } from "./ItemForgeDetailPanel";
import { ItemForgeSearchResults } from "./ItemForgeSearchResults";
import { ItemForgeTable } from "./ItemForgeTable";

export function ItemForgeList() {
  const { items, loading, uniqueTypes } = useItemForge();
  const itemDescMap = useForgeIngredientDescMap();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<RaintdmItem | null>(null);

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
  const searchResults = useItemForgeSearch(items, appliedSearch);

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
          <h1 className="text-2xl font-bold text-foreground">Items Forge</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {!loading && (
            <>
              {items.length} RAINTDM items across {uniqueTypes.length} types.
              Craft with the listed tool and two Amellwind ingredients (Combo
              List rules).
            </>
          )}
        </p>
      </div>

      <SearchInput
        value={searchDraft}
        onChange={setSearchDraft}
        placeholder="Search items or ingredients…"
      />

      {loading || isSearchPending ? (
        <ListAreaLoading />
      ) : isSearching ? (
        <ItemForgeSearchResults
          results={searchResults}
          query={appliedSearch}
          selected={selected}
          onSelect={setSelected}
          itemDescMap={itemDescMap}
        />
      ) : (
        <>
          <ItemTabBar
            types={uniqueTypes}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <ItemForgeTable
            items={tabItems}
            selected={selected}
            onSelect={setSelected}
            itemDescMap={itemDescMap}
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
          <ItemForgeDetailPanel
            item={selected}
            onClose={() => setSelected(null)}
            itemDescMap={itemDescMap}
          />
        </>
      )}
    </div>
  );
}
