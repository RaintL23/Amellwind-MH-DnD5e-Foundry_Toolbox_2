import { useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundFaction,
  BACKGROUND_FACTION_LABELS,
} from "@/shared/types";
import { getAllBackgrounds } from "../services/background.service";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { BackgroundCard } from "./BackgroundCard";
import { BackgroundDetailDialog } from "./BackgroundDetailDialog";
import { Input } from "@/components/ui/input";
import { Search, ScrollText } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const FACTION_FILTERS: Array<{ value: "" | BackgroundFaction; label: string }> =
  [
    { value: "", label: "All" },
    {
      value: "hunters-guild",
      label: BACKGROUND_FACTION_LABELS["hunters-guild"],
    },
    {
      value: "handlers-guild",
      label: BACKGROUND_FACTION_LABELS["handlers-guild"],
    },
    { value: "wycademy", label: BACKGROUND_FACTION_LABELS.wycademy },
  ];

export function BackgroundList() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [factionFilter, setFactionFilter] = useState<"" | BackgroundFaction>(
    "",
  );
  const [selected, setSelected] = useState<Background | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllBackgrounds()
      .then(setBackgrounds)
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const filtered = useMemo(() => {
    let result = backgrounds;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.fluff.toLowerCase().includes(q) ||
          b.proficiencies.skills.toLowerCase().includes(q) ||
          BACKGROUND_FACTION_LABELS[b.faction].toLowerCase().includes(q),
      );
    }

    if (factionFilter) {
      result = result.filter((b) => b.faction === factionFilter);
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [backgrounds, debouncedSearch, factionFilter]);

  function handleSelect(item: Background) {
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Trasfondos</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {backgrounds.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Trasfondos de facción de Amellwind&apos;s Guide to Monster Hunting:
          Hunters Guild, Handlers Guild and Wycademy.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search background..."
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {FACTION_FILTERS.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setFactionFilter(value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                factionFilter === value
                  ? "border-primary bg-primary/20 text-primary"
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
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading backgrounds...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <ScrollText className="h-10 w-10 opacity-20" />
            <p className="text-sm">No backgrounds found with those filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <BackgroundCard
                key={item.id}
                background={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && selected && (
        <BackgroundDetailDialog
          background={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
