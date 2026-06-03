import {
  ADVENTURES_JSON_URL,
  BOOKS_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";

export type BookSourceNameMap = Record<string, string>;

export type SourceOption = {
  value: string;
  label: string;
};

let cache: BookSourceNameMap | null = null;

type SourceCatalogEntry = {
  name?: string;
  source?: string;
  id?: string;
};

function indexSourceCatalog(
  entries: SourceCatalogEntry[] | undefined,
): BookSourceNameMap {
  const map: BookSourceNameMap = {};

  for (const entry of entries ?? []) {
    const name = typeof entry.name === "string" ? entry.name : null;
    if (!name) continue;

    const source = typeof entry.source === "string" ? entry.source : null;
    const id = typeof entry.id === "string" ? entry.id : null;

    if (source) map[source] = name;
    if (id) map[id] = name;
  }

  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function indexBooks(raw: any): BookSourceNameMap {
  const books = Array.isArray(raw?.book) ? raw.book : [];
  return indexSourceCatalog(books);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function indexAdventures(raw: any): BookSourceNameMap {
  const adventures = Array.isArray(raw?.adventure) ? raw.adventure : [];
  return indexSourceCatalog(adventures);
}

function mergeSourceNameMaps(
  ...maps: BookSourceNameMap[]
): BookSourceNameMap {
  return Object.assign({}, ...maps);
}

export async function getBookSourceNames(): Promise<BookSourceNameMap> {
  if (cache) return cache;

  const [adventuresResult, booksResult] = await Promise.allSettled([
    fetchFiveToolsJson<unknown>(ADVENTURES_JSON_URL, "adventures.json").then(
      indexAdventures,
    ),
    fetchFiveToolsJson<unknown>(BOOKS_JSON_URL, "books.json").then(indexBooks),
  ]);

  const adventuresMap =
    adventuresResult.status === "fulfilled" ? adventuresResult.value : {};
  const booksMap =
    booksResult.status === "fulfilled" ? booksResult.value : {};

  cache = mergeSourceNameMaps(adventuresMap, booksMap);
  return cache;
}

export function resolveBookSourceName(
  map: BookSourceNameMap,
  sourceCode: string,
): string {
  return map[sourceCode] ?? sourceCode;
}

export function collectEntitySources(
  entities: Array<{ source: string; variantSources?: string[] }>,
): string[] {
  const sources = new Set<string>();
  for (const entity of entities) {
    for (const source of entity.variantSources ?? [entity.source]) {
      sources.add(source);
    }
  }
  return [...sources];
}

export function buildSourceOptions(
  sourceCodes: Iterable<string>,
  bookNames: BookSourceNameMap,
): SourceOption[] {
  return [...new Set(sourceCodes)]
    .map((value) => ({
      value,
      label: resolveBookSourceName(bookNames, value),
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
}

export function clearBookSourceCache(): void {
  cache = null;
}
