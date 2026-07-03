import { useCallback, useEffect, useMemo, useState } from "react";
import type { DndRace } from "@/shared/types";
import { Users } from "lucide-react";
import {
  getAllDndRaces,
  getDndRacesByName,
  getListDndRaces,
} from "../services/dnd-race.service";
import {
  buildSourceOptions,
  collectEntitySources,
} from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useDataTableUrlState } from "@/shared/hooks/useDataTableUrlState";
import { DND_RACE_COLUMN_URL_MAP } from "./dnd-race-list-url.constants";
import { DndRaceDataTable } from "./DndRaceDataTable";
import { DndRaceDetailDialog } from "@/features/dnd-races/components/DndRaceDetailDialog";

export function DndRaceList() {
  const [races, setRaces] = useState<DndRace[]>([]);
  const [listRaces, setListRaces] = useState<DndRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DndRace | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<DndRace[]>([]);
  const bookNames = useBookSourceNames();
  const { initialSearch, initialColumnFilters, handleFilterStateChange } =
    useDataTableUrlState(DND_RACE_COLUMN_URL_MAP);

  useEffect(() => {
    Promise.all([getAllDndRaces(), getListDndRaces()])
      .then(([all, list]) => {
        setRaces(all);
        setListRaces(list);
      })
      .finally(() => setLoading(false));
  }, []);

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listRaces), bookNames),
    [listRaces, bookNames],
  );

  const handleSelect = useCallback((race: DndRace) => {
    setSelected(race);
    setDialogOpen(true);
    void getDndRacesByName(race.name).then(setSelectedVariants);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-foreground">
            Races (D&amp;D 5e)
          </h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {listRaces.length} races
              {listRaces.length < races.length && (
                <span className="opacity-70"> ({races.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Official species, subraces, and lineages from D&amp;D 5e sourcebooks.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <span className="text-sm">Loading races...</span>
            </div>
          </div>
        ) : listRaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Users className="h-10 w-10 opacity-20" />
            <p className="text-sm">No races loaded.</p>
          </div>
        ) : (
          <DndRaceDataTable
            races={listRaces}
            sourceOptions={sourceOptions}
            onRowClick={handleSelect}
            initialSearch={initialSearch}
            initialColumnFilters={initialColumnFilters}
            onFilterStateChange={handleFilterStateChange}
          />
        )}
      </div>

      {dialogOpen && selected && (
        <DndRaceDetailDialog
          key={selected.id}
          race={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
