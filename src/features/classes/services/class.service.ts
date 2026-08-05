import { Class } from "@/shared/types";
import {
  CLASSES_BASE_URL,
  CLASS_INDEX_URL,
  SUBCLASS_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import {
  createEntityService,
} from "@/shared/services/create-entity-service";
import { getSourceCatalog } from "@/shared/services/source-catalog.service";
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

/** Bump when mapped Class shape changes so in-memory cache is rebuilt. */
const CLASS_CACHE_VERSION = 20;

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
        },
      ];
      documents = [...results, ...uaDocs];
    }

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
  service.clearCache();
  mappedCacheVersion = null;
  lookupCache = null;
}
