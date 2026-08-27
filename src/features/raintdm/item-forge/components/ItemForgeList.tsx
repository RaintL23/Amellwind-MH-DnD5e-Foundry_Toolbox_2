import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
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

  const { q, patchFilters } = useListSessionFilters({
    listId: "item-forge",
    stringKeys: ["q"],
    multiKeys: [],
    urlPreserveKeys: ["type"],
  });

  const defaultType = uniqueTypes[0] ?? "";
  const activeTab = searchParams.get("type") ?? defaultType;

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
  const searchResults = useItemForgeSearch(items, appliedSearch);

  const tabItems = useMemo(
    () => items.filter((item) => item.typeLabel === activeTab),
    [items, activeTab],
  );

  const handleTabChange = (tab: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab && tab !== defaultType) next.set("type", tab);
        else next.delete("type");
        return next;
      },
      { replace: true },
    );
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
