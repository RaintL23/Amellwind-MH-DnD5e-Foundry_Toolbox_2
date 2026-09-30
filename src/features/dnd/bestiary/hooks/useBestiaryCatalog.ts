import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import {
  getAllBestiaryCreatures,
  getBestiarySourceCatalog,
  getListBestiaryCreatures,
  preloadBestiarySources,
} from "../services/bestiary.service";

const SOURCE_CHUNK_SIZE = 8;

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export interface BestiaryLoadProgress {
  loaded: number;
  total: number;
}

export interface UseBestiaryCatalogResult {
  creatures: BestiaryCreature[];
  listCreatures: BestiaryCreature[];
  filterSourceCodes: string[];
  loadedSources: string[];
  loading: boolean;
  progress: BestiaryLoadProgress | null;
  refreshCreatures: () => Promise<void>;
  /** Load missing sources in chunks; refreshes list after each chunk. */
  preloadMissingSources: (wanted: string[]) => void;
}

export function useBestiaryCatalog(): UseBestiaryCatalogResult {
  const [creatures, setCreatures] = useState<BestiaryCreature[]>([]);
  const [listCreatures, setListCreatures] = useState<BestiaryCreature[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<BestiaryLoadProgress | null>(null);

  const preloadGenRef = useRef(0);
  const loadedSourcesRef = useRef<string[]>([]);
  loadedSourcesRef.current = loadedSources;

  const refreshCreatures = useCallback(async () => {
    const [all, list, sourceCatalog] = await Promise.all([
      getAllBestiaryCreatures(),
      getListBestiaryCreatures(),
      getBestiarySourceCatalog(),
    ]);
    startTransition(() => {
      setCreatures(all);
      setListCreatures(list);
      setFilterSourceCodes(sourceCatalog.available);
      setLoadedSources(sourceCatalog.loaded);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshCreatures();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshCreatures]);

  const preloadMissingSources = useCallback(
    (wanted: string[]) => {
      const missing = wanted.filter(
        (s) => !loadedSourcesRef.current.includes(s),
      );
      if (missing.length === 0) {
        setProgress(null);
        return;
      }

      const gen = ++preloadGenRef.current;
      const alreadyLoaded = loadedSourcesRef.current.length;
      const total = alreadyLoaded + missing.length;
      setProgress({ loaded: alreadyLoaded, total });

      void (async () => {
        for (let i = 0; i < missing.length; i += SOURCE_CHUNK_SIZE) {
          if (preloadGenRef.current !== gen) return;
          const chunk = missing.slice(i, i + SOURCE_CHUNK_SIZE);
          await preloadBestiarySources(chunk);
          if (preloadGenRef.current !== gen) return;
          await refreshCreatures();
          if (preloadGenRef.current !== gen) return;
          setProgress({
            loaded: alreadyLoaded + Math.min(i + chunk.length, missing.length),
            total,
          });
          await yieldToMain();
        }
        if (preloadGenRef.current === gen) {
          setProgress(null);
        }
      })();
    },
    [refreshCreatures],
  );

  return {
    creatures,
    listCreatures,
    filterSourceCodes,
    loadedSources,
    loading,
    progress,
    refreshCreatures,
    preloadMissingSources,
  };
}
