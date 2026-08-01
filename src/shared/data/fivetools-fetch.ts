import { LOCAL_5ETOOLS_BASE, CACHE_TTL_MS } from "@/shared/constants/api.constants";
import { getStoreValue, setStoreValue } from "@/shared/db/database";

const jsonCache = new Map<string, unknown>();
/** URLs with an in-flight background revalidation, to avoid duplicate refreshes. */
const revalidating = new Set<string>();

interface PersistedFiveTools {
  data: unknown;
  timestamp: number;
}

function isLocalFiveToolsData(): boolean {
  return import.meta.env.VITE_5ETOOLS_DATA === "local";
}

function isStale(entry: PersistedFiveTools): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL_MS;
}

/** Production default: remote GitHub mirror. Local public/5etools only when VITE_5ETOOLS_DATA=local. */
export function resolveFiveToolsUrl(
  remoteUrl: string,
  localFileName: string,
): string {
  if (isLocalFiveToolsData()) {
    return `${LOCAL_5ETOOLS_BASE}/${localFileName}`;
  }
  return remoteUrl;
}

async function readPersistedEntry(
  url: string,
): Promise<PersistedFiveTools | undefined> {
  try {
    return await getStoreValue<PersistedFiveTools>("FIVETOOLS_CACHE", url);
  } catch {
    return undefined;
  }
}

async function writePersistedEntry(url: string, data: unknown): Promise<void> {
  try {
    await setStoreValue("FIVETOOLS_CACHE", url, {
      data,
      timestamp: Date.now(),
    } satisfies PersistedFiveTools);
  } catch {
    /* IndexedDB unavailable — the in-memory cache still applies for this session. */
  }
}

/** Fetch from the upstream feed and store it in IndexedDB + the in-memory cache. */
async function fetchAndStore<T>(url: string, persist: boolean): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const data = (await res.json()) as T;
  jsonCache.set(url, data);
  if (persist) void writePersistedEntry(url, data);
  return data;
}

/**
 * Background revalidation: refresh a stale entry from the feed and update the
 * IndexedDB store for the next load. It never throws (stored data was already
 * served) and never overwrites the in-memory value mid-session, so data stays
 * stable within a session and picks up the refresh on the next one.
 */
function revalidateInBackground(url: string): void {
  if (revalidating.has(url)) return;
  revalidating.add(url);
  void (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as unknown;
      await writePersistedEntry(url, data);
    } catch {
      /* Offline / transient failure — keep serving the stored data. */
    } finally {
      revalidating.delete(url);
    }
  })();
}

/**
 * Offline-first read for the 5etools compendium (stale-while-revalidate):
 *   1. In-memory cache (per session).
 *   2. IndexedDB — served immediately when present (the app's source of truth);
 *      a stale entry additionally triggers a background refresh for next time.
 *   3. Network — only on a cold start with nothing stored yet.
 * GitHub is used purely to refresh the stores; IndexedDB is authoritative.
 * IndexedDB is bypassed in local-mirror mode (VITE_5ETOOLS_DATA=local).
 */
export async function fetchFiveToolsJson<T>(
  remoteUrl: string,
  localFileName: string,
): Promise<T> {
  const url = resolveFiveToolsUrl(remoteUrl, localFileName);

  const cached = jsonCache.get(url);
  if (cached !== undefined) return cached as T;

  // Local mirror: files are served from disk (public/5etools), no persistence.
  if (isLocalFiveToolsData()) {
    return await fetchAndStore<T>(url, false);
  }

  const persisted = await readPersistedEntry(url);
  if (persisted) {
    jsonCache.set(url, persisted.data);
    if (isStale(persisted)) revalidateInBackground(url);
    return persisted.data as T;
  }

  // Cold start: nothing stored yet → fetch from the feed and persist it.
  return await fetchAndStore<T>(url, true);
}

export function clearFiveToolsJsonCache(): void {
  jsonCache.clear();
}
