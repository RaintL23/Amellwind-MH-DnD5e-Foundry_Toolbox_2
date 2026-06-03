import { BOOKS_JSON_URL } from "@/shared/constants/api.constants";

export type BookSourceNameMap = Record<string, string>;

export type SourceOption = {
  value: string;
  label: string;
};

let cache: BookSourceNameMap | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function indexBooks(raw: any): BookSourceNameMap {
  const map: BookSourceNameMap = {};
  const books = Array.isArray(raw?.book) ? raw.book : [];

  for (const book of books) {
    const name = typeof book.name === "string" ? book.name : null;
    if (!name) continue;

    const source = typeof book.source === "string" ? book.source : null;
    const id = typeof book.id === "string" ? book.id : null;

    if (source) map[source] = name;
    if (id) map[id] = name;
  }

  return map;
}

export async function getBookSourceNames(): Promise<BookSourceNameMap> {
  if (cache) return cache;

  try {
    const res = await fetch(BOOKS_JSON_URL);
    if (!res.ok) throw new Error(`Failed to fetch books.json: ${res.status}`);
    cache = indexBooks(await res.json());
  } catch {
    cache = {};
  }

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
