import { useState, useMemo, useCallback } from "react";
import {
  RESOURCE_CATEGORY_ICONS,
  RESOURCE_RARITIES,
  RESOURCE_RARITY_STYLES,
  type Resource,
  type ResourceCategory,
  type ResourceRarity,
} from "@/shared/types";
import { getAllResourceTables, searchResources } from "../services/resource.service";
import { cn } from "@/shared/utils/cn";
import { Gem, Hammer } from "lucide-react";
import {
  DeferredListResults,
  ListEmptyState,
} from "@/shared/components/DeferredListResults";
import { ClearableSearchInput } from "@/shared/components/list-filters";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { ResourceDataTable } from "./ResourceDataTable";
import { ResourceDetailDialog } from "./ResourceDetailDialog";

const CATEGORIES: ResourceCategory[] = ["Bonepiles", "Fish", "Insects", "Minerals", "Mushrooms", "Plants"];

export function ResourcePage() {
  const { q, getString, patchFilters } = useListSessionFilters({
    listId: "mh-resources",
    stringKeys: ["q", "category", "rarity", "crafting"],
    multiKeys: [],
  });
  const activeCategory = (getString("category") || "all") as
    | ResourceCategory
    | "all";
  const activeRarity = (getString("rarity") || "all") as ResourceRarity | "all";
  const craftingOnly = getString("crafting") === "1";
  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const allTables = getAllResourceTables();

  const filteredResources = useMemo(() => {
    let list = appliedSearch
      ? searchResources(appliedSearch)
      : allTables.flatMap((t) => t.resources);
    if (activeCategory !== "all") list = list.filter((r) => r.category === activeCategory);
    if (activeRarity !== "all") list = list.filter((r) => r.rarity === activeRarity);
    if (craftingOnly) list = list.filter((r) => r.isCraftingMaterial);
    return list;
  }, [allTables, appliedSearch, activeCategory, activeRarity, craftingOnly]);

  const footnotes = useMemo(() => {
    if (activeCategory === "all") return [];
    return allTables.find((t) => t.category === activeCategory)?.footnotes ?? [];
  }, [allTables, activeCategory]);

  function handleRowClick(r: Resource) {
    setSelected(r);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-border space-y-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Resources</h1>
          <p className="text-sm text-muted-foreground">
            Gathering materials found throughout Monster Hunter environments.
          </p>
        </div>

        <ClearableSearchInput
          placeholder="Search resources..."
          value={searchDraft}
          onChange={setSearchDraft}
        />

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => patchFilters({ category: "" })}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
              activeCategory === "all"
                ? "bg-primary/20 text-primary border-primary/40"
                : "text-muted-foreground border-border hover:bg-accent"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => patchFilters({ category: cat })}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border transition-colors flex items-center gap-1",
                activeCategory === cat
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "text-muted-foreground border-border hover:bg-accent"
              )}
            >
              <span>{RESOURCE_CATEGORY_ICONS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* Rarity filter + crafting toggle */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => patchFilters({ rarity: "" })}
            className={cn(
              "px-2 py-0.5 text-xs rounded-full border transition-colors",
              activeRarity === "all"
                ? "bg-primary/20 text-primary border-primary/40"
                : "text-muted-foreground border-border hover:bg-accent"
            )}
          >
            All Rarities
          </button>
          {RESOURCE_RARITIES.map((r) => {
            const s = RESOURCE_RARITY_STYLES[r];
            return (
              <button
                key={r}
                onClick={() => patchFilters({ rarity: r })}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full border transition-colors",
                  activeRarity === r ? cn(s.badge, "opacity-100") : "text-muted-foreground border-border hover:bg-accent"
                )}
              >
                {r}
              </button>
            );
          })}
          <button
            onClick={() =>
              patchFilters({ crafting: craftingOnly ? "" : "1" })
            }
            className={cn(
              "ml-auto flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors",
              craftingOnly
                ? "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                : "text-muted-foreground border-border hover:bg-accent"
            )}
          >
            <Hammer className="h-3 w-3" />
            Crafting Only
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Footnotes */}
        {footnotes.length > 0 && (
          <div className="rounded-lg border border-border bg-card/50 p-3 space-y-1">
            {footnotes.map((f, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">{f}</p>
            ))}
          </div>
        )}

        <DeferredListResults
          loading={false}
          updating={isSearchPending}
          isEmpty={filteredResources.length === 0}
          empty={<ListEmptyState icon={Gem} message="No resources found." />}
        >
          <ResourceDataTable
            resources={filteredResources}
            onRowClick={handleRowClick}
          />
        </DeferredListResults>
      </div>

      <ResourceDetailDialog
        resource={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
