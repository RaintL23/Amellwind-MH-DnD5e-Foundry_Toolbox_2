/**
 * On-demand entity-service factory.
 *
 * Collapses the incremental "raw pool → mapped cache + indexes" pattern used by
 * catalogs that load 5etools sources lazily (items, bestiary, …). Sources are
 * merged into a shared raw pool via list-builder helpers; this factory tracks
 * which raw rows have been mapped, rebuilds byId/byName/list indexes, and
 * exposes the standard read surface plus preload/source-catalog helpers.
 */
export interface OnDemandEntityServiceConfig<TRaw, TMapped> {
  /** Sources loaded on the first `getAll` when the mapped cache is empty. */
  defaultSources: readonly string[];
  /** Loads one or more sources into the raw pool. */
  loadSources: (sources: string[]) => Promise<unknown>;
  /** Loads a single source into the raw pool. */
  loadSource: (source: string) => Promise<unknown>;
  /** Returns every raw entity currently in the pool. */
  getAllRaw: () => TRaw[];
  /**
   * Stable dedupe key for a raw row; return `null` to skip mapping.
   * Typically name|source (or the feature's entity-key helper).
   */
  entityKey: (raw: TRaw) => string | null;
  /** Maps a single raw entity to its domain model. */
  map: (raw: TRaw) => TMapped;
  /** Called after sources are loaded and before syncing the mapped cache. */
  onSourcesLoaded?: () => void;
  /** Stable unique id, enables `getById` via an index. */
  idOf: (item: TMapped) => string;
  /** Grouping key for `getByName` (and dedupe input). */
  nameOf: (item: TMapped) => string;
  /** Produces the deduplicated list view returned by `getList`. */
  dedupe?: (items: TMapped[]) => TMapped[];
  /** Ordering applied to the variants returned by `getByName`. */
  sortVariants?: (a: TMapped, b: TMapped) => number;
  /** Alternative to `sortVariants`: transforms the whole name group (legacy array sorters). */
  sortVariantGroup?: (group: TMapped[]) => TMapped[];
  /** Returns available vs loaded source codes for the source picker UI. */
  getSourceCatalog: () => Promise<{ available: string[]; loaded: string[] }>;
  /** Extra cleanup when `clearCache` runs (builder caches, related services, …). */
  onClearCache?: () => void;
}

export interface OnDemandEntityService<TMapped> {
  getAll(): Promise<TMapped[]>;
  getList(): Promise<TMapped[]>;
  getById(id: string): Promise<TMapped | undefined>;
  getByName(name: string): Promise<TMapped[]>;
  preloadSources(sources: string[]): Promise<TMapped[]>;
  loadSourceOnDemand(source: string): Promise<TMapped[]>;
  getSourceCatalog(): Promise<{ available: string[]; loaded: string[] }>;
  clearCache(): void;
}

export function createOnDemandEntityService<TRaw, TMapped>(
  config: OnDemandEntityServiceConfig<TRaw, TMapped>,
): OnDemandEntityService<TMapped> {
  let cache: TMapped[] = [];
  let listCache: TMapped[] | null = null;
  let byNameIndex: Map<string, TMapped[]> | null = null;
  let indexById: Map<string, TMapped> | null = null;
  const mappedKeys = new Set<string>();

  function buildIndexes(items: TMapped[]): void {
    indexById = new Map<string, TMapped>();
    for (const item of items) indexById.set(config.idOf(item), item);

    const byName = new Map<string, TMapped[]>();
    for (const item of items) {
      const key = config.nameOf(item);
      const group = byName.get(key) ?? [];
      group.push(item);
      byName.set(key, group);
    }
    byNameIndex = byName;
    listCache = config.dedupe ? config.dedupe(items) : items;
  }

  function appendMapped(rawItems: TRaw[]): void {
    const newItems: TMapped[] = [];

    for (const raw of rawItems) {
      const key = config.entityKey(raw);
      if (key === null || mappedKeys.has(key)) continue;
      mappedKeys.add(key);
      newItems.push(config.map(raw));
    }

    if (newItems.length === 0) return;

    cache = [...cache, ...newItems];
    buildIndexes(cache);
  }

  function syncCacheFromPool(): void {
    appendMapped(config.getAllRaw());
  }

  async function afterSourcesLoaded(): Promise<void> {
    config.onSourcesLoaded?.();
    syncCacheFromPool();
  }

  async function getAll(): Promise<TMapped[]> {
    if (cache.length === 0) {
      await config.loadSources([...config.defaultSources]);
      await afterSourcesLoaded();
    }
    return cache;
  }

  async function getList(): Promise<TMapped[]> {
    await getAll();
    return listCache ?? [];
  }

  async function getById(id: string): Promise<TMapped | undefined> {
    if (indexById === null) await getAll();
    return indexById?.get(id);
  }

  async function getByName(name: string): Promise<TMapped[]> {
    await getAll();
    const group = byNameIndex?.get(name) ?? [];
    if (config.sortVariantGroup) return config.sortVariantGroup(group);
    const result = [...group];
    if (config.sortVariants) result.sort(config.sortVariants);
    return result;
  }

  async function preloadSources(sources: string[]): Promise<TMapped[]> {
    await config.loadSources(sources);
    await afterSourcesLoaded();
    return cache;
  }

  async function loadSourceOnDemand(source: string): Promise<TMapped[]> {
    await config.loadSource(source);
    await afterSourcesLoaded();
    return cache;
  }

  function clearCache(): void {
    cache = [];
    listCache = null;
    byNameIndex = null;
    indexById = null;
    mappedKeys.clear();
    config.onClearCache?.();
  }

  return {
    getAll,
    getList,
    getById,
    getByName,
    preloadSources,
    loadSourceOnDemand,
    getSourceCatalog: config.getSourceCatalog,
    clearCache,
  };
}
