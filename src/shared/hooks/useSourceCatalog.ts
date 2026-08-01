import { useEffect, useState } from "react";
import {
  getSourceCatalog,
  type SourceCatalogEntry,
} from "@/shared/services/source-catalog.service";

let cachedCatalog: Map<string, SourceCatalogEntry> | null = null;
let loadPromise: Promise<Map<string, SourceCatalogEntry>> | null = null;

function loadCatalog(): Promise<Map<string, SourceCatalogEntry>> {
  if (cachedCatalog) return Promise.resolve(cachedCatalog);
  if (!loadPromise) {
    loadPromise = getSourceCatalog().then((catalog) => {
      cachedCatalog = catalog;
      return catalog;
    });
  }
  return loadPromise;
}

export function useSourceCatalog(): Map<string, SourceCatalogEntry> {
  const [catalog, setCatalog] = useState<Map<string, SourceCatalogEntry>>(
    cachedCatalog ?? new Map(),
  );

  useEffect(() => {
    void loadCatalog().then(setCatalog);
  }, []);

  return catalog;
}

export function clearSourceCatalogHookCache(): void {
  cachedCatalog = null;
  loadPromise = null;
}
