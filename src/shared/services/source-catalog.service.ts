import {
  ADVENTURES_JSON_URL,
  BOOKS_JSON_URL,
  DDB_SOURCE_CODES,
  HOMEBREW_BASE_URL,
  HOMEBREW_INDEX_META_URL,
  HOMEBREW_INDEX_PROPS_URL,
  HOMEBREW_INDEX_SOURCES_URL,
  HOMEBREW_INDEX_TIMESTAMPS_URL,
  UA_BASE_URL,
  UA_INDEX_META_URL,
  UA_INDEX_PROPS_URL,
  UA_INDEX_SOURCES_URL,
  UA_INDEX_TIMESTAMPS_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import type {
  ListFilterOption,
  ListFilterOptionGroup,
} from "@/shared/components/list-filters/list-filter.types";

export type SourceKind = "official" | "ua" | "ddb" | "partnered";

/** Brew feed that hosts the JSON for a non-official source. */
export type BrewFeed = "ua" | "homebrew";

export type BookSourceNameMap = Record<string, string>;

export type SourceOption = {
  value: string;
  label: string;
};

export type SourceCatalogEntry = {
  code: string;
  name: string;
  kind: SourceKind;
  /** ISO date YYYY-MM-DD when known. */
  published?: string;
  year?: number;
  /** Relative path in the brew feed when this source is loaded on demand. */
  uaPath?: string;
  /** Which brew feed `uaPath` resolves against. Defaults to `"ua"`. */
  brewFeed?: BrewFeed;
};

type OfficialCatalogEntry = {
  name?: string;
  source?: string;
  id?: string;
  published?: string;
};

type BrewIndexSources = Record<string, string>;
type BrewIndexMeta = Record<
  string,
  { n?: string[]; a?: string[]; e?: number; p?: number; s?: string }
>;
type BrewIndexTimestamps = Record<
  string,
  { a?: number; m?: number; p?: number }
>;
/** prop → { brewRelativePath → prop } */
type BrewIndexProps = Record<string, Record<string, string>>;

const DDB_SET = new Set<string>(DDB_SOURCE_CODES);

let catalogCache: Map<string, SourceCatalogEntry> | null = null;
let nameMapCache: BookSourceNameMap | null = null;
/** `${feed}:${path}` keys for brew files that contain a given prop. */
const brewPropPathCache = new Map<string, Promise<Set<string>>>();

function yearFromIso(published: string | undefined): number | undefined {
  if (!published) return undefined;
  const match = /^(\d{4})/.exec(published);
  return match ? Number(match[1]) : undefined;
}

function yearFromUnix(seconds: number | undefined): number | undefined {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000).getUTCFullYear();
}

function isoFromUnix(seconds: number | undefined): string | undefined {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function indexOfficialCatalog(
  entries: OfficialCatalogEntry[] | undefined,
  into: Map<string, SourceCatalogEntry>,
): void {
  for (const entry of entries ?? []) {
    const name = typeof entry.name === "string" ? entry.name : null;
    if (!name) continue;
    const code =
      (typeof entry.source === "string" && entry.source) ||
      (typeof entry.id === "string" && entry.id) ||
      null;
    if (!code) continue;

    const published =
      typeof entry.published === "string" ? entry.published : undefined;
    const next: SourceCatalogEntry = {
      code,
      name,
      kind: "official",
      published,
      year: yearFromIso(published),
    };

    const existing = into.get(code);
    if (!existing || existing.kind !== "official") {
      into.set(code, next);
    }

    if (typeof entry.id === "string" && entry.id !== code) {
      into.set(entry.id, { ...next, code: entry.id });
    }
    if (typeof entry.source === "string" && entry.source !== code) {
      into.set(entry.source, { ...next, code: entry.source });
    }
  }
}

function kindForUaCode(code: string): SourceKind {
  return DDB_SET.has(code) ? "ddb" : "ua";
}

/** Sources that load on demand from a brew feed (not in the official mirror). */
export function isOnDemandBrewSourceKind(
  kind: SourceKind | undefined,
): boolean {
  return kind === "ua" || kind === "ddb" || kind === "partnered";
}

function brewFileName(path: string): string {
  return path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
}

function mergeBrewIndexIntoCatalog(options: {
  sources: BrewIndexSources;
  meta: BrewIndexMeta;
  timestamps: BrewIndexTimestamps;
  into: Map<string, SourceCatalogEntry>;
  feed: BrewFeed;
  /** When set, only include meta entries with `p === 1` (partnered). */
  partneredOnly?: boolean;
  kindForCode: (code: string) => SourceKind;
}): void {
  const {
    sources,
    meta,
    timestamps,
    into,
    feed,
    partneredOnly,
    kindForCode,
  } = options;

  for (const [code, path] of Object.entries(sources)) {
    if (into.has(code) && into.get(code)?.kind === "official") continue;

    const fileName = brewFileName(path);
    const metaEntry = meta[fileName];
    if (partneredOnly && metaEntry?.p !== 1) continue;

    const stamp = timestamps[path];
    const abbrs = metaEntry?.a ?? [];
    const names = metaEntry?.n ?? [];
    const abbrIdx = abbrs.indexOf(code);
    const name =
      (abbrIdx >= 0 ? names[abbrIdx] : undefined) ??
      names[0] ??
      fileName.replace(/\.json$/i, "").replace(/^Unearthed Arcana(?: \d+)? - /, "UA: ");
    const published = isoFromUnix(stamp?.p);
    const year = yearFromUnix(stamp?.p);
    const kind = kindForCode(code);

    into.set(code, {
      code,
      name,
      kind,
      published,
      year,
      uaPath: path,
      brewFeed: feed,
    });

    for (let i = 0; i < abbrs.length; i++) {
      const alt = abbrs[i];
      if (!alt) continue;
      if (into.has(alt) && into.get(alt)?.kind === "official") continue;
      into.set(alt, {
        code: alt,
        name: names[i] ?? name,
        kind: kindForCode(alt),
        published,
        year,
        uaPath: path,
        brewFeed: feed,
      });
    }
  }
}

async function loadCatalogMap(): Promise<Map<string, SourceCatalogEntry>> {
  if (catalogCache) return catalogCache;

  const map = new Map<string, SourceCatalogEntry>();

  const [
    booksResult,
    adventuresResult,
    uaSourcesResult,
    uaMetaResult,
    uaTsResult,
    hbSourcesResult,
    hbMetaResult,
    hbTsResult,
  ] = await Promise.allSettled([
    fetchFiveToolsJson<unknown>(BOOKS_JSON_URL, "books.json"),
    fetchFiveToolsJson<unknown>(ADVENTURES_JSON_URL, "adventures.json"),
    fetchFiveToolsJson<BrewIndexSources>(
      UA_INDEX_SOURCES_URL,
      "ua/_generated/index-sources.json",
    ),
    fetchFiveToolsJson<BrewIndexMeta>(
      UA_INDEX_META_URL,
      "ua/_generated/index-meta.json",
    ),
    fetchFiveToolsJson<BrewIndexTimestamps>(
      UA_INDEX_TIMESTAMPS_URL,
      "ua/_generated/index-timestamps.json",
    ),
    fetchFiveToolsJson<BrewIndexSources>(
      HOMEBREW_INDEX_SOURCES_URL,
      "homebrew/_generated/index-sources.json",
    ),
    fetchFiveToolsJson<BrewIndexMeta>(
      HOMEBREW_INDEX_META_URL,
      "homebrew/_generated/index-meta.json",
    ),
    fetchFiveToolsJson<BrewIndexTimestamps>(
      HOMEBREW_INDEX_TIMESTAMPS_URL,
      "homebrew/_generated/index-timestamps.json",
    ),
  ]);

  if (booksResult.status === "fulfilled") {
    const raw = booksResult.value as { book?: OfficialCatalogEntry[] };
    indexOfficialCatalog(raw.book, map);
  }
  if (adventuresResult.status === "fulfilled") {
    const raw = adventuresResult.value as { adventure?: OfficialCatalogEntry[] };
    indexOfficialCatalog(raw.adventure, map);
  }

  const uaSources =
    uaSourcesResult.status === "fulfilled" ? uaSourcesResult.value : {};
  const uaMeta = uaMetaResult.status === "fulfilled" ? uaMetaResult.value : {};
  const uaTs = uaTsResult.status === "fulfilled" ? uaTsResult.value : {};
  mergeBrewIndexIntoCatalog({
    sources: uaSources,
    meta: uaMeta,
    timestamps: uaTs,
    into: map,
    feed: "ua",
    kindForCode: kindForUaCode,
  });

  const hbSources =
    hbSourcesResult.status === "fulfilled" ? hbSourcesResult.value : {};
  const hbMeta = hbMetaResult.status === "fulfilled" ? hbMetaResult.value : {};
  const hbTs = hbTsResult.status === "fulfilled" ? hbTsResult.value : {};
  mergeBrewIndexIntoCatalog({
    sources: hbSources,
    meta: hbMeta,
    timestamps: hbTs,
    into: map,
    feed: "homebrew",
    partneredOnly: true,
    kindForCode: () => "partnered",
  });

  catalogCache = map;
  return map;
}

export async function getSourceCatalog(): Promise<Map<string, SourceCatalogEntry>> {
  return loadCatalogMap();
}

export async function getBookSourceNames(): Promise<BookSourceNameMap> {
  if (nameMapCache) return nameMapCache;
  const catalog = await loadCatalogMap();
  const map: BookSourceNameMap = {};
  for (const [code, entry] of catalog) {
    map[code] = entry.name;
  }
  nameMapCache = map;
  return map;
}

export function resolveBookSourceName(
  map: BookSourceNameMap,
  sourceCode: string,
): string {
  return map[sourceCode] ?? sourceCode;
}

export function getSourceDisplayName(
  code: string,
  catalog: Map<string, SourceCatalogEntry>,
  bookNames: BookSourceNameMap,
): string {
  return catalog.get(code)?.name ?? resolveBookSourceName(bookNames, code);
}

function normalizeSourceLabel(label: string): string {
  return label.trim().toLowerCase();
}

/** Prefer the longest code as canonical (json id over short abbreviation). */
function pickCanonicalSourceCode(codes: string[]): string {
  return [...codes].sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.localeCompare(b);
  })[0]!;
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

/** Official (or unknown-as-official when not in UA/DDB/partnered catalog) codes for defaults. */
export function defaultOfficialSourceCodes(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
): string[] {
  const codes = [...new Set(sourceCodes)];
  const official = codes.filter((code) => {
    const entry = catalog.get(code);
    if (!entry) return true;
    return entry.kind === "official";
  });

  // Collapse same display-name aliases so defaults / URL stay unique by label.
  const byName = new Map<string, string[]>();
  for (const code of official) {
    const key = normalizeSourceLabel(
      getSourceDisplayName(code, catalog, {}),
    );
    const group = byName.get(key) ?? [];
    group.push(code);
    byName.set(key, group);
  }
  return [...byName.values()].map(pickCanonicalSourceCode);
}

/**
 * Official defaults published on/after `minYear` (D&D 2024+ when minYear=2024).
 * Codes without a catalog year are kept only for known 2024 core books.
 */
export function defaultOfficialSourceCodesSince(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
  minYear = 2024,
): string[] {
  const FALLBACK_CORE_2024 = new Set(["XPHB", "XDMG", "XMM"]);
  return defaultOfficialSourceCodes(sourceCodes, catalog).filter((code) => {
    const entry = catalog.get(code);
    if (!entry) return FALLBACK_CORE_2024.has(code);
    if (entry.kind !== "official") return false;
    if (entry.year != null) return entry.year >= minYear;
    return FALLBACK_CORE_2024.has(code);
  });
}

const SOURCE_KIND_ORDER: SourceKind[] = [
  "official",
  "partnered",
  "ua",
  "ddb",
];

const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  official: "Official",
  partnered: "Partnered",
  ua: "Unearthed Arcana",
  ddb: "D&D Beyond",
};

export function sourceKindLabel(kind: SourceKind): string {
  return SOURCE_KIND_LABELS[kind];
}

function resolveSourceKind(
  codes: string[],
  catalog: Map<string, SourceCatalogEntry>,
): SourceKind {
  for (const code of codes) {
    const kind = catalog.get(code)?.kind;
    if (kind) return kind;
  }
  return "official";
}

/**
 * Collapse source codes that share a display name into one filter option.
 * Aliases keep all identity codes so selecting the pill matches every variant.
 */
export function buildSourceFilterSectionOptions(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
  bookNames: BookSourceNameMap,
): { options: ListFilterOption[]; groups: ListFilterOptionGroup[] } {
  const unique = [...new Set(sourceCodes)];
  const byName = new Map<
    string,
    {
      label: string;
      codes: string[];
      year?: number;
      published?: string;
    }
  >();

  for (const code of unique) {
    const entry = catalog.get(code);
    const label = entry?.name ?? resolveBookSourceName(bookNames, code);
    const key = normalizeSourceLabel(label);
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, {
        label,
        codes: [code],
        year: entry?.year,
        published: entry?.published,
      });
      continue;
    }
    existing.codes.push(code);
    if (
      entry?.year != null &&
      (existing.year == null || entry.year > existing.year)
    ) {
      existing.year = entry.year;
      existing.published = entry.published;
    } else if (!existing.published && entry?.published) {
      existing.published = entry.published;
    }
  }

  const enriched = [...byName.values()].map((group) => {
    const value = pickCanonicalSourceCode(group.codes);
    const aliases = group.codes.filter((code) => code !== value);
    return {
      value,
      label: group.label,
      aliases: aliases.length > 0 ? aliases : undefined,
      year: group.year,
      published: group.published,
      kind: resolveSourceKind(group.codes, catalog),
    };
  });

  enriched.sort((a, b) => {
    const ka = SOURCE_KIND_ORDER.indexOf(a.kind);
    const kb = SOURCE_KIND_ORDER.indexOf(b.kind);
    if (ka !== kb) return ka - kb;
    const ya = a.year ?? -1;
    const yb = b.year ?? -1;
    if (ya !== yb) return yb - ya;
    const pa = a.published ?? "";
    const pb = b.published ?? "";
    if (pa !== pb) return pb.localeCompare(pa);
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });

  const options: ListFilterOption[] = enriched.map(
    ({ value, label, aliases }) => ({
      value,
      label,
      aliases,
    }),
  );

  /** Nested groups: kind (Official / Partnered / …) → year subgroups. */
  const byKind = new Map<
    SourceKind,
    Map<string, ListFilterOption[]>
  >();

  for (const item of enriched) {
    const yearKey = item.year != null ? String(item.year) : "Unknown";
    let byYear = byKind.get(item.kind);
    if (!byYear) {
      byYear = new Map();
      byKind.set(item.kind, byYear);
    }
    const yearOptions = byYear.get(yearKey) ?? [];
    yearOptions.push({
      value: item.value,
      label: item.label,
      aliases: item.aliases,
    });
    byYear.set(yearKey, yearOptions);
  }

  const groups: ListFilterOptionGroup[] = SOURCE_KIND_ORDER.filter((kind) =>
    byKind.has(kind),
  ).map((kind) => {
    const byYear = byKind.get(kind)!;
    const yearKeys = [...byYear.keys()].sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return Number(b) - Number(a);
    });

    const yearGroups: ListFilterOptionGroup[] = yearKeys.map((year) => ({
      id: `kind-${kind}-year-${year}`,
      label: year === "Unknown" ? "Unknown year" : year,
      options: byYear.get(year) ?? [],
    }));

    return {
      id: `kind-${kind}`,
      label: SOURCE_KIND_LABELS[kind],
      options: yearGroups.flatMap((g) => g.options),
      groups: yearGroups,
    };
  });

  return { options, groups };
}

function brewBaseUrl(feed: BrewFeed | undefined): string {
  return feed === "homebrew" ? HOMEBREW_BASE_URL : UA_BASE_URL;
}

/** Absolute raw URL for a path inside a brew feed (UA or partnered homebrew). */
export function brewFileUrl(
  relativePath: string,
  feed: BrewFeed | undefined = "ua",
): string {
  return `${brewBaseUrl(feed)}/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
}

/** @deprecated Prefer {@link brewFileUrl}. */
export function uaFileUrl(relativePath: string): string {
  return brewFileUrl(relativePath, "ua");
}

export function brewLocalPath(
  relativePath: string,
  feed: BrewFeed | undefined = "ua",
): string {
  const prefix = feed === "homebrew" ? "homebrew" : "ua";
  return `${prefix}/${relativePath}`;
}

/** @deprecated Prefer {@link brewLocalPath}. */
export function uaLocalPath(relativePath: string): string {
  return brewLocalPath(relativePath, "ua");
}

export async function getBrewPathsForSources(
  sourceCodes: Iterable<string>,
): Promise<Array<{ path: string; feed: BrewFeed }>> {
  const catalog = await loadCatalogMap();
  const byKey = new Map<string, { path: string; feed: BrewFeed }>();
  for (const code of sourceCodes) {
    const entry = catalog.get(code);
    if (!entry?.uaPath) continue;
    const feed = entry.brewFeed ?? "ua";
    byKey.set(`${feed}:${entry.uaPath}`, { path: entry.uaPath, feed });
  }
  return [...byKey.values()];
}

/** @deprecated Prefer {@link getBrewPathsForSources}. */
export async function getUaPathsForSources(
  sourceCodes: Iterable<string>,
): Promise<string[]> {
  const paths = await getBrewPathsForSources(sourceCodes);
  return paths.map((p) => p.path);
}

function brewPropCacheKey(feed: BrewFeed, prop: string): string {
  return `${feed}:${prop}`;
}

async function loadBrewPathsForProp(
  feed: BrewFeed,
  prop: string,
): Promise<Set<string>> {
  const cacheKey = brewPropCacheKey(feed, prop);
  const cached = brewPropPathCache.get(cacheKey);
  if (cached) return cached;

  const pending = (async () => {
    const url =
      feed === "homebrew" ? HOMEBREW_INDEX_PROPS_URL : UA_INDEX_PROPS_URL;
    const local =
      feed === "homebrew"
        ? "homebrew/_generated/index-props.json"
        : "ua/_generated/index-props.json";
    try {
      const index = await fetchFiveToolsJson<BrewIndexProps>(url, local);
      const paths = index[prop] ?? {};
      return new Set(Object.keys(paths));
    } catch {
      return new Set<string>();
    }
  })();

  brewPropPathCache.set(cacheKey, pending);
  return pending;
}

/**
 * On-demand brew / partnered source codes whose files contain any of `props`
 * (via `_generated/index-props.json`). Prefer this over dumping every
 * `collection/` path into a feature filter — collections often lack the entity.
 */
export async function collectOnDemandBrewSourceCodesForProps(
  props: readonly string[],
): Promise<string[]> {
  if (props.length === 0) return [];

  const catalog = await loadCatalogMap();
  const pathKeys = new Set<string>();

  await Promise.all(
    (["ua", "homebrew"] as const).flatMap((feed) =>
      props.map(async (prop) => {
        const paths = await loadBrewPathsForProp(feed, prop);
        for (const path of paths) pathKeys.add(`${feed}:${path}`);
      }),
    ),
  );

  const codes: string[] = [];
  for (const [code, entry] of catalog) {
    if (!entry.uaPath || !isOnDemandBrewSourceKind(entry.kind)) continue;
    const feed = entry.brewFeed ?? "ua";
    if (pathKeys.has(`${feed}:${entry.uaPath}`)) {
      codes.push(code);
    }
  }
  return codes;
}

export function clearSourceCatalogCache(): void {
  catalogCache = null;
  nameMapCache = null;
  brewPropPathCache.clear();
}

export function clearBookSourceCache(): void {
  clearSourceCatalogCache();
}
