import { useEffect, useMemo, useState } from "react";
import { Feat } from "@/shared/types";
import { getAllFeats } from "../services/feat.service";
import { FeatCard } from "./FeatCard";
import { FeatDetailDialog } from "./FeatDetailDialog";
import { Input } from "@/components/ui/input";
import { Search, Award } from "lucide-react";
import { cn } from "@/shared/utils/cn";

type FeatFilter = "" | "repeatable" | "ability" | "prerequisite";

const FILTERS: Array<{ value: FeatFilter; label: string }> = [
  { value: "", label: "All" },
  { value: "repeatable", label: "Repeatable" },
  { value: "ability", label: "With ability increases" },
  { value: "prerequisite", label: "With prerequisites" },
];

export function FeatList() {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FeatFilter>("");
  const [selected, setSelected] = useState<Feat | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllFeats()
      .then(setFeats)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = feats;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.summary.toLowerCase().includes(q) ||
          f.paragraphs.some((p) => p.toLowerCase().includes(q)) ||
          f.prerequisites.some((p) => p.toLowerCase().includes(q)),
      );
    }

    if (filter === "repeatable") {
      result = result.filter((f) => f.repeatable);
    } else if (filter === "ability") {
      result = result.filter((f) => f.abilityIncreases.length > 0);
    } else if (filter === "prerequisite") {
      result = result.filter((f) => f.prerequisites.length > 0);
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [feats, search, filter]);

  function handleSelect(item: Feat) {
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Award className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Feats (MH)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {feats.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Optional feats from Amellwind&apos;s Guide to Monster Hunting:
          weapons, mount, crafting and druid variants.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3 space-y-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feat..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                filter === value
                  ? "border-amber-500 bg-amber-500/20 text-amber-400"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm">Loading feats...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Award className="h-10 w-10 opacity-20" />
            <p className="text-sm">No feats found with those filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <FeatCard
                key={item.id}
                feat={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}
      </div>

      <FeatDetailDialog
        feat={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
