import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DndBackground } from "@/shared/types";
import { ScrollText } from "lucide-react";
import {
  getAllDndBackgrounds,
  getDndBackgroundsByName,
  getListDndBackgrounds,
} from "../services/dnd-background.service";
import {
  buildSourceOptions,
  collectEntitySources,
} from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useDataTableUrlState } from "@/shared/hooks/useDataTableUrlState";
import { DND_BACKGROUND_COLUMN_URL_MAP } from "./dnd-background-list-url.constants";
import { DndBackgroundDataTable } from "./DndBackgroundDataTable";
import { DndBackgroundDetailDialog } from "./DndBackgroundDetailDialog";

export function DndBackgroundList() {
  const [backgrounds, setBackgrounds] = useState<DndBackground[]>([]);
  const [listBackgrounds, setListBackgrounds] = useState<DndBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DndBackground | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<DndBackground[]>([]);
  const bookNames = useBookSourceNames();
  const { initialSearch, initialColumnFilters, handleFilterStateChange } =
    useDataTableUrlState(DND_BACKGROUND_COLUMN_URL_MAP);

  useEffect(() => {
    Promise.all([getAllDndBackgrounds(), getListDndBackgrounds()])
      .then(([all, list]) => {
        setBackgrounds(all);
        setListBackgrounds(list);
      })
      .finally(() => setLoading(false));
  }, []);

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listBackgrounds), bookNames),
    [listBackgrounds, bookNames],
  );

  const handleSelect = useCallback((background: DndBackground) => {
    setSelected(background);
    setDialogOpen(true);
    void getDndBackgroundsByName(background.name).then(setSelectedVariants);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <ScrollText className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">
            Backgrounds (D&amp;D 5e)
          </h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {listBackgrounds.length} backgrounds
              {listBackgrounds.length < backgrounds.length && (
                <span className="opacity-70">
                  {" "}
                  ({backgrounds.length} entries)
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Official character backgrounds from D&amp;D 5e sourcebooks.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <ListAreaLoading />
        ) : listBackgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <ScrollText className="h-10 w-10 opacity-20" />
            <p className="text-sm">No backgrounds loaded.</p>
          </div>
        ) : (
          <DndBackgroundDataTable
            backgrounds={listBackgrounds}
            sourceOptions={sourceOptions}
            onRowClick={handleSelect}
            initialSearch={initialSearch}
            initialColumnFilters={initialColumnFilters}
            onFilterStateChange={handleFilterStateChange}
          />
        )}
      </div>

      {dialogOpen && selected && (
        <DndBackgroundDetailDialog
          key={selected.id}
          background={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
