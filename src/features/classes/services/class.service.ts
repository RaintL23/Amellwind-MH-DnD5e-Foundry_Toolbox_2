import { Class } from "@/shared/types";
import {
  CLASSES_BASE_URL,
  CLASS_INDEX_URL,
  SUBCLASS_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import {
  getSourceCatalog,
  isOnDemandBrewSourceKind,
} from "@/shared/services/source-catalog.service";
import {
  collectUaPropEntries,
  loadUaBrewDocuments,
} from "@/shared/services/ua-brew.service";
import { mapClass } from "../mappers/class.mapper";
import type {
  ClassFileDocument,
  SubclassLookup,
} from "../utils/class-raw.types";
import { processAllClasses } from "../utils/class-processor.utils";
import { dedupeClassesByName } from "../utils/class-dedupe.utils";

/** Bump when mapped Class shape changes so in-memory cache is rebuilt. */
const CLASS_CACHE_VERSION = 20;

let cache: Class[] | null = null;
let cacheVersion: number | null = null;
let listCache: Class[] | null = null;
let byNameIndex: Map<string, Class[]> | null = null;
let lookupCache: SubclassLookup | null = null;
const loadedUaSources = new Set<string>();

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

async function loadRawClassDocuments(): Promise<ClassFileDocument[]> {
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

  if (loadedUaSources.size === 0) return results;

  const docs = await loadUaBrewDocuments(loadedUaSources);
  const uaDocs: ClassFileDocument[] = [
    {
      class: collectUaPropEntries(docs, "class"),
      subclass: collectUaPropEntries(docs, "subclass"),
      classFeature: collectUaPropEntries(docs, "classFeature"),
      subclassFeature: collectUaPropEntries(docs, "subclassFeature"),
    },
  ];

  return [...results, ...uaDocs];
}

function buildIndexes(all: Class[]): void {
  const byName = new Map<string, Class[]>();
  for (const cls of all) {
    const group = byName.get(cls.name) ?? [];
    group.push(cls);
    byName.set(cls.name, group);
  }
  byNameIndex = byName;
  listCache = dedupeClassesByName(all);
}

export async function getAllClasses(): Promise<Class[]> {
  if (cache && cacheVersion === CLASS_CACHE_VERSION) return cache;

  await getSubclassLookup();

  const documents = await loadRawClassDocuments();

  const classes = documents.flatMap((doc) => doc.class ?? []);
  const subclasses = documents.flatMap((doc) => doc.subclass ?? []);
  const classFeatures = documents.flatMap((doc) => doc.classFeature ?? []);
  const subclassFeatures = documents.flatMap(
    (doc) => doc.subclassFeature ?? [],
  );

  const processed = processAllClasses(
    classes,
    subclasses,
    classFeatures,
    subclassFeatures,
  );

  cache = processed.map((c) =>
    mapClass(c, classFeatures, subclassFeatures),
  );
  cacheVersion = CLASS_CACHE_VERSION;
  buildIndexes(cache);
  return cache;
}

export async function getListClasses(): Promise<Class[]> {
  await getAllClasses();
  return listCache ?? [];
}

export async function getClassesByName(name: string): Promise<Class[]> {
  await getAllClasses();
  return byNameIndex?.get(name) ?? [];
}

export async function getClassById(id: string): Promise<Class | undefined> {
  const all = await getAllClasses();
  return all.find((c) => c.id === id);
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

export async function ensureClassUaSourcesLoaded(
  sourceCodes: string[],
): Promise<boolean> {
  const catalog = await getSourceCatalog();
  const needed = sourceCodes.filter((code) => {
    const kind = catalog.get(code)?.kind;
    return isOnDemandBrewSourceKind(kind) && !loadedUaSources.has(code);
  });
  if (needed.length === 0) return false;
  for (const code of needed) loadedUaSources.add(code);
  clearClassCache();
  await getAllClasses();
  return true;
}

export async function getClassFilterSourceCodes(): Promise<string[]> {
  const [catalog, list] = await Promise.all([
    getSourceCatalog(),
    getListClasses(),
  ]);
  const codes = new Set<string>(
    list.flatMap((c) => c.variantSources ?? [c.source]),
  );
  for (const [code, entry] of catalog) {
    if (
      entry.uaPath &&
      (entry.uaPath.startsWith("class/") ||
        entry.uaPath.startsWith("subclass/") ||
        entry.uaPath.startsWith("collection/"))
    ) {
      codes.add(code);
    }
  }
  return [...codes];
}

export function clearClassCache(): void {
  cache = null;
  cacheVersion = null;
  listCache = null;
  byNameIndex = null;
  lookupCache = null;
}
