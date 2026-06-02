import { Class } from "@/shared/types";
import {
  CLASS_SOURCE_FILES,
  CLASSES_BASE_URL,
  SUBCLASS_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { mapClass } from "../mappers/class.mapper";
import type {
  ClassFileDocument,
  SubclassLookup,
} from "../utils/class-raw.types";
import { processAllClasses } from "../utils/class-processor.utils";

let cache: Class[] | null = null;
let lookupCache: SubclassLookup | null = null;

async function getSubclassLookup(): Promise<SubclassLookup> {
  if (lookupCache) return lookupCache;

  try {
    const res = await fetch(SUBCLASS_LOOKUP_URL);
    if (!res.ok)
      throw new Error(`Failed to fetch subclass lookup: ${res.status}`);
    lookupCache = (await res.json()) as SubclassLookup;
  } catch {
    lookupCache = {};
  }

  return lookupCache;
}

async function loadRawClassDocuments(): Promise<ClassFileDocument[]> {
  const urls = Object.values(CLASS_SOURCE_FILES).map(
    (file) => `${CLASSES_BASE_URL}/${file}`,
  );

  const results = await Promise.all(
    urls.map((url) =>
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
          return r.json() as Promise<ClassFileDocument>;
        })
        .catch(() => ({}) as ClassFileDocument),
    ),
  );
  return results;
}

export async function getAllClasses(): Promise<Class[]> {
  if (cache) return cache;

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

  cache = processed.map(mapClass);
  return cache;
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

export function clearClassCache(): void {
  cache = null;
  lookupCache = null;
}
