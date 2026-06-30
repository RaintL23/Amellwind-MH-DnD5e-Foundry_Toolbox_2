/**
 * Generic entity-service factory.
 *
 * Collapses the repeated "module cache + byName/byId index + dedupe + clear"
 * boilerplate that every feature data service used to hand-roll. A service is
 * declared by providing how to load the raw entities and how to map them; the
 * factory returns the standard `getAll` / `getList` / `getById` / `getByName` /
 * `clearCache` surface. Concurrent `getAll` calls share a single in-flight load.
 *
 * Services with extra views (e.g. `getXByType`, bespoke filters) keep those as
 * thin wrappers over the returned `getAll`.
 */
export interface EntityServiceConfig<TRaw, TMapped> {
  /** Loads the raw entities (fetch, sync-store read, flatten, etc.). */
  loadRaw: () => Promise<TRaw[]>;
  /** Maps a single raw entity to its domain model. Use identity if pre-mapped. */
  map: (raw: TRaw) => TMapped;
  /** Stable unique id, enables `getById` via an index. */
  idOf?: (item: TMapped) => string;
  /** Grouping key for `getByName` (and dedupe input). */
  nameOf?: (item: TMapped) => string;
  /** Produces the deduplicated list view returned by `getList`. */
  dedupe?: (items: TMapped[]) => TMapped[];
  /** Ordering applied to the variants returned by `getByName`. */
  sortVariants?: (a: TMapped, b: TMapped) => number;
}

export interface EntityService<TMapped> {
  getAll(): Promise<TMapped[]>;
  getList(): Promise<TMapped[]>;
  getById(id: string): Promise<TMapped | undefined>;
  getByName(name: string): Promise<TMapped[]>;
  clearCache(): void;
}

export function createEntityService<TRaw, TMapped>(
  config: EntityServiceConfig<TRaw, TMapped>,
): EntityService<TMapped> {
  let cache: TMapped[] | null = null;
  let listCache: TMapped[] | null = null;
  let byNameIndex: Map<string, TMapped[]> | null = null;
  let byIdIndex: Map<string, TMapped> | null = null;
  let loadingPromise: Promise<TMapped[]> | null = null;

  function buildIndexes(all: TMapped[]): void {
    if (config.idOf) {
      const byId = new Map<string, TMapped>();
      for (const item of all) byId.set(config.idOf(item), item);
      byIdIndex = byId;
    }

    if (config.nameOf) {
      const byName = new Map<string, TMapped[]>();
      for (const item of all) {
        const key = config.nameOf(item);
        const group = byName.get(key) ?? [];
        group.push(item);
        byName.set(key, group);
      }
      byNameIndex = byName;
    }

    listCache = config.dedupe ? config.dedupe(all) : all;
  }

  async function getAll(): Promise<TMapped[]> {
    if (cache) return cache;
    if (!loadingPromise) {
      loadingPromise = config
        .loadRaw()
        .then((raws) => {
          const mapped = raws.map((raw) => config.map(raw));
          cache = mapped;
          buildIndexes(mapped);
          return mapped;
        })
        .finally(() => {
          loadingPromise = null;
        });
    }
    return loadingPromise;
  }

  async function getList(): Promise<TMapped[]> {
    await getAll();
    return listCache ?? [];
  }

  async function getById(id: string): Promise<TMapped | undefined> {
    await getAll();
    if (byIdIndex) return byIdIndex.get(id);
    if (config.idOf) return (cache ?? []).find((i) => config.idOf!(i) === id);
    return undefined;
  }

  async function getByName(name: string): Promise<TMapped[]> {
    await getAll();
    const group = byNameIndex?.get(name) ?? [];
    const result = [...group];
    if (config.sortVariants) result.sort(config.sortVariants);
    return result;
  }

  function clearCache(): void {
    cache = null;
    listCache = null;
    byNameIndex = null;
    byIdIndex = null;
    loadingPromise = null;
  }

  return { getAll, getList, getById, getByName, clearCache };
}

/** Default `getByName` ordering: ascending by `source`. */
export function bySource<T extends { source: string }>(a: T, b: T): number {
  return a.source.localeCompare(b.source);
}
