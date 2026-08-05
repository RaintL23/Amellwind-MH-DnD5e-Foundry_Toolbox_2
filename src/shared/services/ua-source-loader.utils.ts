import {
  getSourceCatalog,
  isOnDemandBrewSourceKind,
} from "@/shared/services/source-catalog.service";

export interface UaSourceLoaderOptions {
  loadedUaSources: Set<string>;
  clearCache: () => void;
  reload: () => Promise<unknown>;
}

/**
 * Shared helper for `ensure*UaSourcesLoaded` across D&D catalog services.
 * Filters to on-demand brew sources not yet in the pool, marks them loaded,
 * clears the service cache, and reloads.
 */
export function createUaSourceLoader(
  options: UaSourceLoaderOptions,
): (sourceCodes: string[]) => Promise<boolean> {
  return async function ensureUaSourcesLoaded(
    sourceCodes: string[],
  ): Promise<boolean> {
    const catalog = await getSourceCatalog();
    const needed = sourceCodes.filter((code) => {
      const kind = catalog.get(code)?.kind;
      return isOnDemandBrewSourceKind(kind) && !options.loadedUaSources.has(code);
    });
    if (needed.length === 0) return false;
    for (const code of needed) options.loadedUaSources.add(code);
    options.clearCache();
    await options.reload();
    return true;
  };
}
