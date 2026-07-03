import { useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundFaction,
  BACKGROUND_FACTION_LABELS,
} from "@/shared/types";
import { getAllBackgrounds } from "../services/background.service";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useListUrlState } from "@/shared/hooks/useListUrlState";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { BackgroundCard } from "./BackgroundCard";
import { BackgroundDetailDialog } from "./BackgroundDetailDialog";
import { ScrollText } from "lucide-react";

const FACTION_OPTIONS = (
  Object.entries(BACKGROUND_FACTION_LABELS) as Array<
    [BackgroundFaction, string]
  >
).map(([value, label]) => ({ value, label }));

const BACKGROUND_FILTER_SECTIONS = [
  {
    id: "faction",
    title: "Guild",
    mode: "single" as const,
    options: FACTION_OPTIONS,
  },
];

export function BackgroundList() {
  const { getString, setString, patchFields } = useListUrlState();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const search = getString("q");
  const factionFilter = getString("faction") as "" | BackgroundFaction;
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

  function applyDialogFilters(values: ListFilterValues) {
    const faction =
      typeof values.faction === "string" ? values.faction : "";
    patchFields({ faction });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Backgrounds</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {backgrounds.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Backgrounds from Amellwind&apos;s Guide to Monster Hunting: Hunters
          Guild, Handlers Guild and Wycademy.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <ListSearchWithFilters
          searchValue={search}
          onSearchChange={(q) => setString("q", q)}
          searchPlaceholder="Search background..."
          inputClassName="h-8 text-sm"
          sections={BACKGROUND_FILTER_SECTIONS}
          filterValues={{ faction: factionFilter }}
          onFiltersApply={applyDialogFilters}
          dialogTitle="Background Filters"
          dialogDescription="Filter backgrounds by guild affiliation."
        />
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
