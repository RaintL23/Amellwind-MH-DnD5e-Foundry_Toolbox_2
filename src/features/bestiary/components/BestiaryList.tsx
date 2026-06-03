import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { buildSourceOptions } from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { cn } from "@/shared/utils/cn";
import {
  collectBestiarySources,
  getAllBestiaryCreatures,
  getBestiarySourceCatalog,
  getListBestiaryCreatures,
  loadSourceOnDemand,
} from "../services/bestiary.service";
import { BestiaryDataTable } from "./BestiaryDataTable";

export function BestiaryList() {
  const navigate = useNavigate();
  const [creatures, setCreatures] = useState<BestiaryCreature[]>([]);
  const [listCreatures, setListCreatures] = useState<BestiaryCreature[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSource, setLoadingSource] = useState<string | null>(null);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const bookNames = useBookSourceNames();

  const refreshCreatures = useCallback(async () => {
    const [all, list, catalog] = await Promise.all([
      getAllBestiaryCreatures(),
      getListBestiaryCreatures(),
      getBestiarySourceCatalog(),
    ]);
    setCreatures(all);
    setListCreatures(list);
    setAvailableSources(catalog.available);
    setLoadedSources(catalog.loaded);
  }, []);

  useEffect(() => {
    refreshCreatures().finally(() => setLoading(false));
  }, [refreshCreatures]);

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const c of listCreatures) types.add(c.type.type);
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [listCreatures]);

  const environmentOptions = useMemo(() => {
    const envs = new Set<string>();
    for (const c of listCreatures) {
      for (const e of c.environment ?? []) envs.add(e);
    }
    return Array.from(envs).sort((a, b) => a.localeCompare(b));
  }, [listCreatures]);

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectBestiarySources(listCreatures), bookNames),
    [listCreatures, bookNames],
  );

  const unloadedSources = useMemo(
    () => availableSources.filter((s) => !loadedSources.includes(s)),
    [availableSources, loadedSources],
  );

  async function handleLoadSource(source: string) {
    setLoadingSource(source);
    try {
      await loadSourceOnDemand(source);
      await refreshCreatures();
    } finally {
      setLoadingSource(null);
    }
  }

  const handleSelect = useCallback(
    (row: BestiaryCreature) => {
      navigate(`/bestiary/${encodeURIComponent(row.id)}`);
    },
    [navigate],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Swords className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Bestiary (D&amp;D 5e)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {listCreatures.length} creatures
              {listCreatures.length < creatures.length && (
                <span className="opacity-70"> ({creatures.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          One row per creature name; open to compare sources and view stat blocks.
        </p>
      </div>

      {!loading && unloadedSources.length > 0 && (
        <div className="shrink-0 border-b border-border px-6 py-3">
          <p className="text-xs text-muted-foreground mb-2">
            Load additional sources ({loadedSources.length}/{availableSources.length} loaded):
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {unloadedSources.slice(0, 40).map((source) => (
              <button
                key={source}
                type="button"
                disabled={loadingSource === source}
                onClick={() => void handleLoadSource(source)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  loadingSource === source
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {loadingSource === source ? "…" : `+ ${source}`}
              </button>
            ))}
            {unloadedSources.length > 40 && (
              <span className="text-[10px] text-muted-foreground self-center px-1">
                +{unloadedSources.length - 40} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm">Loading bestiary...</span>
            </div>
          </div>
        ) : listCreatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Swords className="h-10 w-10 opacity-20" />
            <p className="text-sm">No creatures loaded.</p>
          </div>
        ) : (
          <BestiaryDataTable
            creatures={listCreatures}
            typeOptions={typeOptions}
            environmentOptions={environmentOptions}
            sourceOptions={sourceOptions}
            onRowClick={handleSelect}
          />
        )}
      </div>

    </div>
  );
}
