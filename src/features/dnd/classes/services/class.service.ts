import { Class } from "@/shared/types";
import {
  CLASSES_BASE_URL,
  CLASS_INDEX_URL,
  SUBCLASS_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { createEntityService } from "@/shared/services/create-entity-service";
import {
  brewFileUrl,
  brewLocalPath,
  collectOnDemandBrewSourceCodesForProps,
  getBrewPathsForSources,
  getSourceCatalog,
  type BrewFeed,
} from "@/shared/services/source-catalog.service";
import {
  collectUaPropEntries,
  loadUaBrewDocuments,
} from "@/shared/services/ua-brew.service";
import { createUaSourceLoader } from "@/shared/services/ua-source-loader.utils";
import { mapClass } from "../mappers/class.mapper";
import type {
  ClassFileDocument,
  SubclassLookup,
} from "../utils/class-raw.types";
import { processAllClasses } from "../utils/class-processor.utils";
import { dedupeClassesByName } from "../utils/class-dedupe.utils";
import {
  buildTableIndex,
  inlineStatblockTableRefs,
} from "../utils/class-feature-entries.utils";

/** Bump when mapped Class shape changes so in-memory cache is rebuilt. */
const CLASS_CACHE_VERSION = 24;

let lookupCache: SubclassLookup | null = null;
const loadedUaSources = new Set<string>();
let mappedCacheVersion: number | null = null;

function ensureCacheVersion(): void {
  if (mappedCacheVersion !== CLASS_CACHE_VERSION) {
    service.clearCache();
    mappedCacheVersion = CLASS_CACHE_VERSION;
  }
}

async function getSubclassLookup(): Promise<SubclassLookup> {
  if (lookupCache) return lookupCache;

  try {
    lookupCache = await fetchFiveToolsJson<SubclassLookup>(
      SUBCLASS_LOOKUP_URL,
      "generated/gendata-subclass-lookup.json",
    );
  } catch {
    lookupCache = {};
  }

  return lookupCache;
}

async function loadOfficialClassIndex(): Promise<Record<string, string>> {
  try {
    return await fetchFiveToolsJson<Record<string, string>>(
      CLASS_INDEX_URL,
      "class/index.json",
    );
  } catch {
    return {};
  }
}

const service = createEntityService<Class, Class>({
  loadRaw: async () => {
    await getSubclassLookup();

    const index = await loadOfficialClassIndex();
    const files = Object.values(index);
    const results = await Promise.all(
      files.map((file) =>
        fetchFiveToolsJson<ClassFileDocument>(
          `${CLASSES_BASE_URL}/${file}`,
          `class/${file}`,
        ).catch(() => ({}) as ClassFileDocument),
      ),
    );

    let documents = results;
    if (loadedUaSources.size > 0) {
      const docs = await loadUaBrewDocuments(loadedUaSources);
      const uaDocs: ClassFileDocument[] = [
        {
          class: collectUaPropEntries(docs, "class"),
          subclass: collectUaPropEntries(docs, "subclass"),
          classFeature: collectUaPropEntries(docs, "classFeature"),
          subclassFeature: collectUaPropEntries(docs, "subclassFeature"),
          table: collectUaPropEntries(docs, "table"),
        },
      ];
      documents = [...results, ...uaDocs];
    }

    const classes = documents.flatMap((doc) => doc.class ?? []);
    const subclasses = documents.flatMap((doc) => doc.subclass ?? []);
    const tableIndex = buildTableIndex(documents.flatMap((doc) => doc.table ?? []));
    const classFeatures = inlineStatblockTableRefs(
      documents.flatMap((doc) => doc.classFeature ?? []),
      tableIndex,
    );
    const subclassFeatures = inlineStatblockTableRefs(
      documents.flatMap((doc) => doc.subclassFeature ?? []),
      tableIndex,
    );

    const processed = processAllClasses(
      classes,
      subclasses,
      classFeatures,
      subclassFeatures,
    );

    return processed.map((c) => mapClass(c, classFeatures, subclassFeatures));
  },
  map: (cls) => cls,
  idOf: (cls) => cls.id,
  nameOf: (cls) => cls.name,
  dedupe: dedupeClassesByName,
});

export async function getAllClasses(): Promise<Class[]> {
  ensureCacheVersion();
  return service.getAll();
}

export async function getListClasses(): Promise<Class[]> {
  ensureCacheVersion();
  return service.getList();
}

export async function getClassesByName(name: string): Promise<Class[]> {
  ensureCacheVersion();
  return service.getByName(name);
}

export async function getClassById(id: string): Promise<Class | undefined> {
  ensureCacheVersion();
  return service.getById(id);
}

export async function getSubclassLookupData(): Promise<SubclassLookup> {
  return getSubclassLookup();
}

export function resolveSubclassDisplayName(
  lookup: SubclassLookup,
  classSource: string,
  className: string,
  subclassSource: string,
  shortName: string,
): string {
  return (
    lookup[classSource]?.[className]?.[subclassSource]?.[shortName]?.name ??
    shortName
  );
}

export const ensureClassUaSourcesLoaded = createUaSourceLoader({
  loadedUaSources,
  clearCache: () => {
    service.clearCache();
    lookupCache = null;
  },
  reload: async () => {
    ensureCacheVersion();
    return service.getAll();
  },
});

/**
 * On-demand brew / UA source codes that ship subclasses and are not loaded yet.
 * The prop index is per file, not per class, so a source may hold no subclass
 * for the class being viewed.
 */
export async function getUnloadedSubclassSourceCodes(): Promise<string[]> {
  const [codes, catalog, loadedPaths] = await Promise.all([
    collectOnDemandBrewSourceCodesForProps(["subclass"]),
    getSourceCatalog(),
    getBrewPathsForSources(loadedUaSources),
  ]);
  // A file can carry several codes (e.g. BoET / BookOfEbonTides): compare by path.
  const loadedKeys = new Set(loadedPaths.map((p) => `${p.feed}:${p.path}`));
  return codes.filter((code) => {
    if (loadedUaSources.has(code)) return false;
    const entry = catalog.get(code);
    return !(
      entry?.uaPath && loadedKeys.has(`${entry.brewFeed ?? "ua"}:${entry.uaPath}`)
    );
  });
}

/** `feed:path` → lowercase class name → subclass count in that brew file. */
const brewSubclassCounts = new Map<string, Promise<Map<string, number>>>();

function subclassCountsForBrewFile(
  path: string,
  feed: BrewFeed,
): Promise<Map<string, number>> {
  const key = `${feed}:${path}`;
  const cached = brewSubclassCounts.get(key);
  if (cached) return cached;

  const pending = fetchFiveToolsJson<{ subclass?: Array<{ className?: string }> }>(
    brewFileUrl(path, feed),
    brewLocalPath(path, feed),
  )
    .then((doc) => {
      const counts = new Map<string, number>();
      for (const sc of doc.subclass ?? []) {
        const name = sc.className?.toLowerCase();
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      return counts;
    })
    .catch(() => new Map<string, number>());
  brewSubclassCounts.set(key, pending);
  return pending;
}

/** Loaded on-demand sources that hold subclasses of `className` → subclass count. */
export async function getLoadedSubclassSourceCounts(
  className: string,
): Promise<Map<string, number>> {
  const catalog = await getSourceCatalog();
  const classKey = className.toLowerCase();
  const matches = new Map<string, number>();
  await Promise.all(
    [...loadedUaSources].map(async (code) => {
      const entry = catalog.get(code);
      if (!entry?.uaPath) return;
      const counts = await subclassCountsForBrewFile(
        entry.uaPath,
        entry.brewFeed ?? "ua",
      );
      const count = counts.get(classKey) ?? 0;
      if (count > 0) matches.set(code, count);
    }),
  );
  return matches;
}

/** Drops on-demand sources (and any alias code sharing their file) from the pool. */
export async function unloadClassUaSources(codes: string[]): Promise<boolean> {
  const catalog = await getSourceCatalog();
  const fileKey = (code: string): string | null => {
    const entry = catalog.get(code);
    return entry?.uaPath ? `${entry.brewFeed ?? "ua"}:${entry.uaPath}` : null;
  };
  const targets = new Set(codes);
  const targetFiles = new Set(
    codes.map(fileKey).filter((key): key is string => key != null),
  );
  let changed = false;
  for (const code of [...loadedUaSources]) {
    const key = fileKey(code);
    if (targets.has(code) || (key != null && targetFiles.has(key))) {
      loadedUaSources.delete(code);
      changed = true;
    }
  }
  if (!changed) return false;
  service.clearCache();
  lookupCache = null;
  ensureCacheVersion();
  await service.getAll();
  return true;
}

const SUBCLASS_SCAN_CONCURRENCY = 6;

/**
 * Scans brew files for subclasses of `className` (the prop index is per file,
 * not per class). Reports matching codes → subclass count as files resolve.
 */
export async function findSubclassSourcesForClass(
  className: string,
  codes: readonly string[],
  onProgress: (
    matches: Map<string, number>,
    done: number,
    total: number,
  ) => void,
  isCancelled: () => boolean,
): Promise<void> {
  const catalog = await getSourceCatalog();
  const files = new Map<
    string,
    { path: string; feed: BrewFeed; codes: string[] }
  >();
  for (const code of codes) {
    const entry = catalog.get(code);
    if (!entry?.uaPath) continue;
    const feed = entry.brewFeed ?? "ua";
    const key = `${feed}:${entry.uaPath}`;
    const file = files.get(key) ?? { path: entry.uaPath, feed, codes: [] };
    file.codes.push(code);
    files.set(key, file);
  }

  const queue = [...files.values()];
  const total = queue.length;
  const classKey = className.toLowerCase();
  const matches = new Map<string, number>();
  let done = 0;

  async function worker(): Promise<void> {
    while (queue.length > 0 && !isCancelled()) {
      const file = queue.shift()!;
      const count =
        (await subclassCountsForBrewFile(file.path, file.feed)).get(classKey) ?? 0;
      done++;
      if (count > 0) for (const code of file.codes) matches.set(code, count);
      if (count > 0 || done === total || done % 20 === 0) {
        onProgress(new Map(matches), done, total);
      }
    }
  }

  await Promise.all(
    Array.from({ length: SUBCLASS_SCAN_CONCURRENCY }, () => worker()),
  );
}

export async function getClassFilterSourceCodes(): Promise<string[]> {
  const [all, brewCodes] = await Promise.all([
    getAllClasses(),
    collectOnDemandBrewSourceCodesForProps(["class", "subclass"]),
  ]);
  return collectClassFilterSourceCodes(all, brewCodes);
}

/**
 * Union of base-class and subclass book codes (plus on-demand brew).
 * Subclass-only books (e.g. RHW Phantom Rogue) must appear in Sources.
 */
export function collectClassFilterSourceCodes(
  classes: readonly Class[],
  brewCodes: readonly string[] = [],
): string[] {
  const codes = new Set<string>();
  for (const cls of classes) {
    codes.add(cls.source);
    for (const source of cls.variantSources ?? []) codes.add(source);
    for (const subclass of cls.subclasses) codes.add(subclass.source);
  }
  for (const code of brewCodes) codes.add(code);
  return [...codes];
}

export function clearClassCache(): void {
  service.clearCache();
  mappedCacheVersion = null;
  lookupCache = null;
}
