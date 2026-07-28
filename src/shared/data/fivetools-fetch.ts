import { LOCAL_5ETOOLS_BASE, CACHE_TTL_MS } from "@/shared/constants/api.constants";
import { getStoreValue, setStoreValue } from "@/shared/db/database";

const jsonCache = new Map<string, unknown>();

interface PersistedFiveTools {
  data: unknown;
  timestamp: number;
}

function isLocalFiveToolsData(): boolean {
  return import.meta.env.VITE_5ETOOLS_DATA === "local";
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

/**
 * Three-tier read-through cache for 5etools compendium JSON:
 *   L1 in-memory (per session) → L2 IndexedDB (fresh, TTL-gated) → L3 network.
 * On network failure, stale IndexedDB data is served as an offline fallback.
 * IndexedDB is bypassed in local-mirror mode (VITE_5ETOOLS_DATA=local).
 */
export async function fetchFiveToolsJson<T>(
  remoteUrl: string,
  localFileName: string,
): Promise<T> {
  const url = resolveFiveToolsUrl(remoteUrl, localFileName);
  const cached = jsonCache.get(url);
  if (cached !== undefined) return cached as T;

  const local = isLocalFiveToolsData();
  const persisted = local ? undefined : await readPersistedEntry(url);
  if (persisted && Date.now() - persisted.timestamp <= CACHE_TTL_MS) {
    jsonCache.set(url, persisted.data);
    return persisted.data as T;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    const data = (await res.json()) as T;
    jsonCache.set(url, data);
    if (!local) void writePersistedEntry(url, data);
    return data;
  } catch (error) {
    // Offline fallback: serve stale persisted data instead of failing outright.
    if (persisted) {
      jsonCache.set(url, persisted.data);
      return persisted.data as T;
    }
    throw error;
  }
}

export function clearFiveToolsJsonCache(): void {
  jsonCache.clear();
}
