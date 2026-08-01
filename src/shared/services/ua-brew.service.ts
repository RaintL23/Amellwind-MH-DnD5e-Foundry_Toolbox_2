import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import {
  brewFileUrl,
  brewLocalPath,
  getBrewPathsForSources,
  getSourceCatalog,
  isOnDemandBrewSourceKind,
  type BrewFeed,
} from "@/shared/services/source-catalog.service";

export type UaBrewDocument = Record<string, unknown> & {
  _meta?: {
    sources?: Array<{ json?: string; abbreviation?: string; partnered?: boolean }>;
  };
};

const loadedDocs = new Map<string, UaBrewDocument>();

function cacheKey(feed: BrewFeed, path: string): string {
  return `${feed}:${path}`;
}

export async function loadUaBrewDocuments(
  sourceCodes: Iterable<string>,
): Promise<UaBrewDocument[]> {
  const paths = await getBrewPathsForSources(sourceCodes);
  const docs: UaBrewDocument[] = [];

  await Promise.all(
    paths.map(async ({ path, feed }) => {
      const key = cacheKey(feed, path);
      const cached = loadedDocs.get(key);
      if (cached) {
        docs.push(cached);
        return;
      }
      try {
        const doc = await fetchFiveToolsJson<UaBrewDocument>(
          brewFileUrl(path, feed),
          brewLocalPath(path, feed),
        );
        loadedDocs.set(key, doc);
        docs.push(doc);
      } catch {
        /* Missing brew file — skip. */
      }
    }),
  );

  return docs;
}

export function collectUaPropEntries<T>(
  docs: UaBrewDocument[],
  prop: string,
): T[] {
  const out: T[] = [];
  for (const doc of docs) {
    const arr = doc[prop];
    if (Array.isArray(arr)) {
      for (const item of arr) out.push(item as T);
    }
  }
  return out;
}

/** On-demand brew source codes that appear for a given entity path prefix. */
export async function listUaSourceCodesForPathPrefix(
  prefix: string,
): Promise<string[]> {
  const catalog = await getSourceCatalog();
  const codes: string[] = [];
  for (const [code, entry] of catalog) {
    if (
      entry.uaPath &&
      (entry.uaPath.startsWith(prefix) ||
        entry.uaPath.startsWith("collection/")) &&
      isOnDemandBrewSourceKind(entry.kind)
    ) {
      codes.push(code);
    }
  }
  return [...new Set(codes)];
}

export function clearUaBrewCache(): void {
  loadedDocs.clear();
}
