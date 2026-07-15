import { useState, useMemo } from "react";
import {
  RESOURCE_CATEGORY_ICONS,
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_RARITY_STYLES,
  type Resource,
  type ResourceCategory,
  type ResourceRarity,
} from "@/shared/types";
import { getAllResourceTables, searchResources } from "../services/resource.service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import { Search, Hammer } from "lucide-react";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";

const CATEGORIES: ResourceCategory[] = ["Bonepiles", "Fish", "Insects", "Minerals", "Mushrooms", "Plants"];
const RARITIES: ResourceRarity[] = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];

function ResourceDetailDialog({
  resource,
  open,
  onClose,
}: {
  resource: Resource | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!resource) return null;
  const style = RESOURCE_RARITY_STYLES[resource.rarity];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{RESOURCE_CATEGORY_ICONS[resource.category]}</span>
            <span>{resource.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs font-semibold", style.badge)}
            >
              {resource.rarity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {RESOURCE_CATEGORY_LABELS[resource.category]}
            </Badge>
            {resource.isCraftingMaterial && (
              <Badge variant="outline" className="text-xs bg-yellow-900/40 text-yellow-300 border-yellow-700">
                <Hammer className="h-3 w-3 mr-1" />
                Crafting Material
              </Badge>
            )}
          </div>

          <div className={cn("rounded-lg border p-4 bg-gradient-to-br", style.bg, style.border)}>
            <p className="text-sm text-muted-foreground leading-relaxed">{resource.details}</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sell Value:</span>
            <span className="font-semibold text-amber-300">{resource.sellValue}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const style = RESOURCE_RARITY_STYLES[resource.rarity];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-3 bg-gradient-to-br transition-all duration-150",
        "hover:scale-[1.02] hover:shadow-md cursor-pointer",
        style.bg,
        style.border
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("font-semibold text-sm truncate", style.text)}>{resource.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.details}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <Badge variant="outline" className={cn("text-xs", style.badge)}>
            {resource.rarity}
          </Badge>
          {resource.isCraftingMaterial && (
            <Hammer className="h-3 w-3 text-yellow-500" />
          )}
        </div>
      </div>
      <p className="text-xs text-amber-400 mt-2 font-medium">{resource.sellValue}</p>
    </button>
  );
}

export function ResourcePage() {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | "all">("all");
  const [activeRarity, setActiveRarity] = useState<ResourceRarity | "all">("all");
  const [craftingOnly, setCraftingOnly] = useState(false);
  const [search, setSearch] = useState("");
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(search, setSearch);
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

  function handleCardClick(r: Resource) {
    setSelected(r);
    setDialogOpen(true);
  }

  const groupedByRarity = useMemo(() => {
    const groups: Partial<Record<ResourceRarity, Resource[]>> = {};
    for (const r of filteredResources) {
      if (!groups[r.rarity]) groups[r.rarity] = [];
      groups[r.rarity]!.push(r);
    }
    return groups;
  }, [filteredResources]);

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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory("all")}
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
              onClick={() => setActiveCategory(cat)}
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
            onClick={() => setActiveRarity("all")}
            className={cn(
              "px-2 py-0.5 text-xs rounded-full border transition-colors",
              activeRarity === "all"
                ? "bg-primary/20 text-primary border-primary/40"
                : "text-muted-foreground border-border hover:bg-accent"
            )}
          >
            All Rarities
          </button>
          {RARITIES.map((r) => {
            const s = RESOURCE_RARITY_STYLES[r];
            return (
              <button
                key={r}
                onClick={() => setActiveRarity(r)}
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
            onClick={() => setCraftingOnly((v) => !v)}
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

        {isSearchPending ? (
          <ListAreaLoading variant="cards" />
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No resources found.</p>
          </div>
        ) : (
          RARITIES.map((rarity) => {
            const items = groupedByRarity[rarity];
            if (!items?.length) return null;
            const s = RESOURCE_RARITY_STYLES[rarity];
            return (
              <section key={rarity}>
                <h2 className={cn("text-sm font-bold mb-3 flex items-center gap-2", s.text)}>
                  <span className={cn("w-2 h-2 rounded-full inline-block", s.badge.split(" ")[0])} />
                  {rarity}
                  <span className="text-muted-foreground font-normal">({items.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {items.map((r) => (
                    <ResourceCard key={`${r.category}-${r.name}`} resource={r} onClick={() => handleCardClick(r)} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      <ResourceDetailDialog
        resource={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
