import { getStoreValue, setStoreValue } from "./database";
import {
  MONSTER_MANUAL_URL,
  GUIDE_TO_MONSTER_HUNTING_URL,
  CACHE_TTL_MS,
  MM_GITHUB_FEED_KEY,
  MM_GITHUB_CONDITION_KEY,
  MM_GITHUB_DISEASE_KEY,
  GTMH_GITHUB_ITEM_KEY,
  GTMH_GITHUB_OPTFEATURE_KEY,
  GTMH_GITHUB_RACE_KEY,
  GTMH_GITHUB_SUBRACE_KEY,
  GTMH_GITHUB_BACKGROUND_KEY,
  GTMH_GITHUB_FEAT_KEY,
  GTMH_GITHUB_VARIANTRULE_KEY,
  GTMH_GITHUB_CLASSFEATURE_KEY,
  GTMH_GITHUB_CLASS_KEY,
  GTMH_GITHUB_OBJECT_KEY,
  GTMH_GITHUB_BOOK_DATA_KEY,
} from "../constants/api.constants";
import {
  getRawMonsterName,
  loadMmPatreonOverlay,
  mergeMonsterFeeds,
  mergeNamedFeeds,
} from "./mm-supplement";
import {
  clearGtmhPatreonSupplementCache,
  loadGtmhPatreonOverlay,
} from "./gtmh-supplement";

const OPT_FEATURES_STORE_KEY = "optfeatures";
const RACE_STORE_KEY = "race";
const SUBRACE_STORE_KEY = "subrace";
const BACKGROUND_STORE_KEY = "background";
const FEAT_STORE_KEY = "feat";
const VARIANT_RULE_STORE_KEY = "variantrule";
const CLASS_FEATURE_STORE_KEY = "classFeature";
const CLASS_STORE_KEY = "class";
const OBJECT_STORE_KEY = "object";
const BOOK_DATA_STORE_KEY = "bookData";
const CONDITION_STORE_KEY = "condition";
const DISEASE_STORE_KEY = "disease";

const GTMH_ARRAY_KEYS = [
  {
    jsonKey: "optionalfeature",
    dataKey: OPT_FEATURES_STORE_KEY,
    githubKey: GTMH_GITHUB_OPTFEATURE_KEY,
  },
  { jsonKey: "race", dataKey: RACE_STORE_KEY, githubKey: GTMH_GITHUB_RACE_KEY },
  {
    jsonKey: "subrace",
    dataKey: SUBRACE_STORE_KEY,
    githubKey: GTMH_GITHUB_SUBRACE_KEY,
  },
  {
    jsonKey: "background",
    dataKey: BACKGROUND_STORE_KEY,
    githubKey: GTMH_GITHUB_BACKGROUND_KEY,
  },
  { jsonKey: "feat", dataKey: FEAT_STORE_KEY, githubKey: GTMH_GITHUB_FEAT_KEY },
  {
    jsonKey: "variantrule",
    dataKey: VARIANT_RULE_STORE_KEY,
    githubKey: GTMH_GITHUB_VARIANTRULE_KEY,
  },
  {
    jsonKey: "classFeature",
    dataKey: CLASS_FEATURE_STORE_KEY,
    githubKey: GTMH_GITHUB_CLASSFEATURE_KEY,
  },
  { jsonKey: "class", dataKey: CLASS_STORE_KEY, githubKey: GTMH_GITHUB_CLASS_KEY },
  {
    jsonKey: "object",
    dataKey: OBJECT_STORE_KEY,
    githubKey: GTMH_GITHUB_OBJECT_KEY,
  },
] as const;

let mmRawCache: unknown[] | null = null;
let mmRawPromise: Promise<unknown[]> | null = null;
let mmConditionCache: unknown[] | null = null;
let mmDiseaseCache: unknown[] | null = null;
let gtmhJsonPromise: Promise<Record<string, unknown>> | null = null;

interface DataMeta {
  timestamp: number;
  url: string;
}

interface SyncResult {
  mmData: unknown[] | null;
  gtmhData: unknown | null;
  updated: {
    mm: boolean;
    gtmh: boolean;
  };
}

async function isDataFresh(
  storeName: "MM_META" | "GTMH_META",
): Promise<boolean> {
  const meta = await getStoreValue<DataMeta>(storeName, "meta");
  if (!meta) return false;
  return Date.now() - meta.timestamp < CACHE_TTL_MS;
}

async function readGithubNamedFeed(
  githubKey: string,
  legacyDataKey: string,
): Promise<unknown[]> {
  const github = await getStoreValue<unknown[]>("MM_CURRENT", githubKey);
  if (Array.isArray(github) && github.length > 0) return github;
  const data = (await getStoreValue<unknown[]>("MM_CURRENT", legacyDataKey)) ?? [];
  return Array.isArray(data) ? data : [];
}

async function readGithubMonsterFeed(): Promise<unknown[]> {
  return readGithubNamedFeed(MM_GITHUB_FEED_KEY, "data");
}

async function persistMergedNamedList(options: {
  githubFeed?: unknown[];
  githubKey: string;
  dataKey: string;
  local: unknown[];
  extraCoveredNames?: string[];
}): Promise<unknown[]> {
  const github = options.githubFeed ?? (await readGithubNamedFeed(options.githubKey, options.dataKey));
  if (options.local.length === 0) {
    if (options.githubFeed) {
      await setStoreValue("MM_CURRENT", options.githubKey, github);
    }
    const existing =
      (await getStoreValue<unknown[]>("MM_CURRENT", options.dataKey)) ?? github;
    return Array.isArray(existing) && existing.length > 0 ? existing : github;
  }
  const { items } = mergeNamedFeeds(github, options.local, options.extraCoveredNames);
  await setStoreValue("MM_CURRENT", options.githubKey, github);
  await setStoreValue("MM_CURRENT", options.dataKey, items);
  return items;
}

/**
 * Merge the Patreon PDF overlay (local wins) onto the GitHub feed and persist
 * snapshots: `github*` = raw feed, `data` / `condition` / `disease` = UI lists.
 */
async function persistMergedMonsterData(
  githubFeed?: unknown[],
): Promise<unknown[]> {
  const overlay = await loadMmPatreonOverlay();
  const github = githubFeed ?? (await readGithubMonsterFeed());
  let monsters: unknown[];
  if (overlay.monster.length === 0) {
    if (githubFeed) {
      await setStoreValue("MM_CURRENT", MM_GITHUB_FEED_KEY, github);
    }
    const existing =
      (await getStoreValue<unknown[]>("MM_CURRENT", "data")) ?? github;
    monsters = Array.isArray(existing) && existing.length > 0 ? existing : github;
  } else {
    monsters = mergeMonsterFeeds(github, overlay.monster).monsters;
    await setStoreValue("MM_CURRENT", MM_GITHUB_FEED_KEY, github);
    await setStoreValue("MM_CURRENT", "data", monsters);
  }
  mmRawCache = monsters;

  const localConditionNames = overlay.condition.map(getRawMonsterName);
  const localDiseaseNames = overlay.disease.map(getRawMonsterName);
  mmConditionCache = await persistMergedNamedList({
    githubKey: MM_GITHUB_CONDITION_KEY,
    dataKey: CONDITION_STORE_KEY,
    local: overlay.condition,
    extraCoveredNames: localDiseaseNames,
  });
  mmDiseaseCache = await persistMergedNamedList({
    githubKey: MM_GITHUB_DISEASE_KEY,
    dataKey: DISEASE_STORE_KEY,
    local: overlay.disease,
    extraCoveredNames: localConditionNames,
  });
  return monsters;
}

/** Persist GitHub snapshots of MM sub-collections; overlay merge happens after. */
async function writeMmDerivedStores(
  json: Record<string, unknown>,
): Promise<void> {
  if (Array.isArray(json.condition)) {
    await setStoreValue("MM_CURRENT", MM_GITHUB_CONDITION_KEY, json.condition);
  }
  if (Array.isArray(json.disease)) {
    await setStoreValue("MM_CURRENT", MM_GITHUB_DISEASE_KEY, json.disease);
  }
}

async function writeGtmhGithubStores(json: Record<string, unknown>): Promise<void> {
  if (Array.isArray(json.item)) {
    await setStoreValue("GTMH_CURRENT", GTMH_GITHUB_ITEM_KEY, json.item);
  }
  for (const key of GTMH_ARRAY_KEYS) {
    if (Array.isArray(json[key.jsonKey])) {
      await setStoreValue("GTMH_CURRENT", key.githubKey, json[key.jsonKey]);
    }
  }
  if (json.bookData && typeof json.bookData === "object") {
    await setStoreValue("GTMH_CURRENT", GTMH_GITHUB_BOOK_DATA_KEY, json.bookData);
  }
}

async function readGithubGtmhList(githubKey: string, dataKey: string): Promise<unknown[]> {
  const github = await getStoreValue<unknown[]>("GTMH_CURRENT", githubKey);
  if (Array.isArray(github) && github.length > 0) return github;
  const data = (await getStoreValue<unknown[]>("GTMH_CURRENT", dataKey)) ?? [];
  return Array.isArray(data) ? data : [];
}

async function persistMergedGtmhNamedList(options: {
  githubKey: string;
  dataKey: string;
  local: unknown[];
  githubFeed?: unknown[];
}): Promise<unknown[]> {
  const github =
    options.githubFeed ??
    (await readGithubGtmhList(options.githubKey, options.dataKey));

  if (options.local.length === 0) {
    if (options.githubFeed) {
      await setStoreValue("GTMH_CURRENT", options.githubKey, github);
    }
    const existing =
      (await getStoreValue<unknown[]>("GTMH_CURRENT", options.dataKey)) ?? github;
    return Array.isArray(existing) && existing.length > 0 ? existing : github;
  }

  const { items } = mergeNamedFeeds(github, options.local);
  await setStoreValue("GTMH_CURRENT", options.githubKey, github);
  await setStoreValue("GTMH_CURRENT", options.dataKey, items);
  return items;
}

async function persistMergedGtmhData(
  githubJson?: Record<string, unknown>,
): Promise<unknown[]> {
  const overlay = await loadGtmhPatreonOverlay();
  const githubItem = githubJson?.item;
  const githubItems = Array.isArray(githubItem) ? githubItem : undefined;

  const mergedItems = await persistMergedGtmhNamedList({
    githubKey: GTMH_GITHUB_ITEM_KEY,
    dataKey: "data",
    local: overlay.item,
    githubFeed: githubItems,
  });

  for (const key of GTMH_ARRAY_KEYS) {
    const local = Array.isArray(overlay[key.jsonKey]) ? overlay[key.jsonKey] : [];
    const github = Array.isArray(githubJson?.[key.jsonKey])
      ? (githubJson?.[key.jsonKey] as unknown[])
      : undefined;
    await persistMergedGtmhNamedList({
      githubKey: key.githubKey,
      dataKey: key.dataKey,
      local,
      githubFeed: github,
    });
  }

  const githubBookData =
    githubJson?.bookData && typeof githubJson.bookData === "object"
      ? (githubJson.bookData as Record<string, unknown>)
      : undefined;
  const localBookData = overlay.bookData;
  if (Object.keys(localBookData).length > 0) {
    if (githubBookData) {
      await setStoreValue("GTMH_CURRENT", GTMH_GITHUB_BOOK_DATA_KEY, githubBookData);
    }
    await setStoreValue("GTMH_CURRENT", BOOK_DATA_STORE_KEY, localBookData);
  } else {
    if (githubBookData) {
      await setStoreValue("GTMH_CURRENT", GTMH_GITHUB_BOOK_DATA_KEY, githubBookData);
      await setStoreValue("GTMH_CURRENT", BOOK_DATA_STORE_KEY, githubBookData);
    } else {
      const existing = await getStoreValue<Record<string, unknown>>(
        "GTMH_CURRENT",
        BOOK_DATA_STORE_KEY,
      );
      if (!existing || Object.keys(existing).length === 0) {
        const fallback = await getStoreValue<Record<string, unknown>>(
          "GTMH_CURRENT",
          GTMH_GITHUB_BOOK_DATA_KEY,
        );
        if (fallback && Object.keys(fallback).length > 0) {
          await setStoreValue("GTMH_CURRENT", BOOK_DATA_STORE_KEY, fallback);
        }
      }
    }
  }

  return mergedItems;
}

type OnDataUpdated = (updated: { mm: boolean; gtmh: boolean }) => void;

export interface SyncOptions {
  /**
   * Invoked when a feed lands new data — on a cold-start fetch or when a
   * background refresh completes (possibly AFTER `syncData` has resolved). Use
   * it to invalidate in-memory caches derived from the refreshed stores.
   */
  onUpdated?: OnDataUpdated;
}

// Guards so React StrictMode's double-invoke or overlapping bootstraps don't
// launch duplicate background refreshes for the same feed.
let mmRefreshInFlight = false;
let gtmhRefreshInFlight = false;

async function fetchAndCacheMonsterManual(): Promise<unknown[] | null> {
  try {
    const response = await fetch(MONSTER_MANUAL_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = (await response.json()) as Record<string, unknown>;
    const github: unknown[] = Array.isArray(json.monster)
      ? (json.monster as unknown[])
      : [];

    const current = await getStoreValue("MM_CURRENT", "data");
    if (current !== undefined) {
      await setStoreValue("MM_PREVIOUS", "data", current);
    }

    await setStoreValue("MM_META", "meta", {
      timestamp: Date.now(),
      url: MONSTER_MANUAL_URL,
    } satisfies DataMeta);
    await writeMmDerivedStores(json);
    return persistMergedMonsterData(github);
  } catch (error) {
    console.warn(`[SyncService] Fetch failed for ${MONSTER_MANUAL_URL}:`, error);
    return null;
  }
}

async function fetchAndCacheGuideToMonsterHunting(): Promise<unknown[] | null> {
  try {
    const response = await fetch(GUIDE_TO_MONSTER_HUNTING_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = (await response.json()) as Record<string, unknown>;
    const current = await getStoreValue("GTMH_CURRENT", "data");
    if (current !== undefined) {
      await setStoreValue("GTMH_PREVIOUS", "data", current);
    }

    await setStoreValue("GTMH_META", "meta", {
      timestamp: Date.now(),
      url: GUIDE_TO_MONSTER_HUNTING_URL,
    } satisfies DataMeta);

    await writeGtmhGithubStores(json);
    clearGtmhPatreonSupplementCache();
    gtmhJsonPromise = null;
    return persistMergedGtmhData(json);
  } catch (error) {
    console.warn(
      `[SyncService] Fetch failed for ${GUIDE_TO_MONSTER_HUNTING_URL}:`,
      error,
    );
    return null;
  }
}

/** Background refresh of the Monster Manual feed; updates the stores for the next load. */
async function refreshMonsterManual(onUpdated?: OnDataUpdated): Promise<void> {
  if (mmRefreshInFlight) return;
  mmRefreshInFlight = true;
  try {
    const fetched = await fetchAndCacheMonsterManual();
    if (fetched !== null) {
      onUpdated?.({ mm: true, gtmh: false });
    }
  } finally {
    mmRefreshInFlight = false;
  }
}

/** Background refresh of the Guide to Monster Hunting feed; updates the stores for the next load. */
async function refreshGuideToMonsterHunting(
  onUpdated?: OnDataUpdated,
): Promise<void> {
  if (gtmhRefreshInFlight) return;
  gtmhRefreshInFlight = true;
  try {
    const fetched = await fetchAndCacheGuideToMonsterHunting();
    if (fetched !== null) {
      onUpdated?.({ mm: false, gtmh: true });
    }
  } finally {
    gtmhRefreshInFlight = false;
  }
}

/**
 * Offline-first sync of the Amellwind homebrew feeds (Monster Manual + Guide to
 * Monster Hunting). Stored IndexedDB data is the source of truth and is served
 * immediately; GitHub is only used to refresh those stores:
 *   - Stored data present → return it now; if stale, refresh in the background
 *     and notify via `onUpdated` when the new data lands.
 *   - Nothing stored (cold start) → fetch from the feed before returning.
 */
export async function syncData(options: SyncOptions = {}): Promise<SyncResult> {
  const { onUpdated } = options;

  const [mmStored, gtmhStored, mmFresh, gtmhFresh] = await Promise.all([
    getStoreValue<unknown[]>("MM_CURRENT", "data"),
    getStoreValue<unknown>("GTMH_CURRENT", "data"),
    isDataFresh("MM_META"),
    isDataFresh("GTMH_META"),
  ]);

  let mmData: unknown[] | null = null;
  let gtmhData: unknown | null = null;
  let mmUpdated = false;
  let gtmhUpdated = false;

  // The two feeds are independent downloads → resolve them in parallel.
  await Promise.all([
    (async () => {
      if (mmStored !== undefined) {
        const hadGithubFeed = await getStoreValue<unknown[]>(
          "MM_CURRENT",
          MM_GITHUB_FEED_KEY,
        );
        const migrating = !Array.isArray(hadGithubFeed);
        mmData = await persistMergedMonsterData();
        if (migrating) {
          mmUpdated = true;
          onUpdated?.({ mm: true, gtmh: false });
        }
        // On first local-wins migrate, refresh GitHub so `github` is the raw
        // feed rather than a previously merged list sitting in `data`.
        if (migrating || !mmFresh) void refreshMonsterManual(onUpdated);
      } else {
        const fetched = await fetchAndCacheMonsterManual();
        if (fetched !== null) {
          mmData = fetched;
          mmUpdated = true;
          onUpdated?.({ mm: true, gtmh: false });
        } else {
          mmData = await persistMergedMonsterData([]);
        }
      }
    })(),
    (async () => {
      if (gtmhStored !== undefined) {
        const hadGithubFeed = await getStoreValue<unknown[]>(
          "GTMH_CURRENT",
          GTMH_GITHUB_ITEM_KEY,
        );
        const migrating = !Array.isArray(hadGithubFeed);
        gtmhData = await persistMergedGtmhData();
        if (migrating) {
          gtmhUpdated = true;
          onUpdated?.({ mm: false, gtmh: true });
        }
        if (!gtmhFresh) void refreshGuideToMonsterHunting(onUpdated);
      } else {
        const fetched = await fetchAndCacheGuideToMonsterHunting();
        if (fetched !== null) {
          gtmhData = fetched;
          gtmhUpdated = true;
          onUpdated?.({ mm: false, gtmh: true });
        } else {
          gtmhData = await persistMergedGtmhData({});
        }
      }
    })(),
  ]);

  return { mmData, gtmhData, updated: { mm: mmUpdated, gtmh: gtmhUpdated } };
}

async function loadMergedMonsterData(): Promise<unknown[]> {
  return persistMergedMonsterData();
}

export async function getMonsterData(): Promise<unknown[]> {
  if (mmRawCache) return mmRawCache;
  if (!mmRawPromise) {
    mmRawPromise = loadMergedMonsterData().finally(() => {
      mmRawPromise = null;
    });
  }
  return mmRawPromise;
}

export function clearMonsterDataCache(): void {
  mmRawCache = null;
  mmRawPromise = null;
  mmConditionCache = null;
  mmDiseaseCache = null;
}

/**
 * Returns the raw condition array (PDF overlay wins; GitHub fills gaps).
 */
export async function getConditionsRaw(): Promise<unknown[]> {
  if (mmConditionCache) return mmConditionCache;
  await persistMergedMonsterData();
  return mmConditionCache ?? [];
}

/**
 * Returns the raw disease array (PDF overlay wins; GitHub fills gaps).
 */
export async function getDiseasesRaw(): Promise<unknown[]> {
  if (mmDiseaseCache) return mmDiseaseCache;
  await persistMergedMonsterData();
  return mmDiseaseCache ?? [];
}

async function fetchGtmhJsonOnce(): Promise<Record<string, unknown>> {
  if (!gtmhJsonPromise) {
    gtmhJsonPromise = fetch(GUIDE_TO_MONSTER_HUNTING_URL)
      .then((response) =>
        response.ok
          ? (response.json() as Promise<Record<string, unknown>>)
          : ({} as Record<string, unknown>),
      )
      .catch(() => ({} as Record<string, unknown>));
  }
  return gtmhJsonPromise;
}

async function ensureGtmhArrayStore(
  jsonKey: string,
  storeKey: string,
): Promise<unknown[]> {
  const cached = await getStoreValue<unknown[]>("GTMH_CURRENT", storeKey);
  if (cached && cached.length > 0) return cached;

  const mergedItems = await persistMergedGtmhData();
  if (storeKey === "data") return mergedItems;
  const merged = await getStoreValue<unknown[]>("GTMH_CURRENT", storeKey);
  if (merged && merged.length > 0) return merged;

  try {
    const json = await fetchGtmhJsonOnce();
    const data: unknown[] = Array.isArray(json[jsonKey])
      ? (json[jsonKey] as unknown[])
      : [];
    await setStoreValue("GTMH_CURRENT", storeKey, data);
    return data;
  } catch {
    return [];
  }
}

export async function getGtmhData(): Promise<unknown> {
  const cached = await getStoreValue<unknown>("GTMH_CURRENT", "data");
  if (cached !== undefined) return cached;
  return persistMergedGtmhData();
}

/**
 * Returns the raw optionalfeature array from the GTMH JSON.
 * If not yet cached (first load after upgrade), fetches lazily from the remote URL.
 */
export async function getOptionalFeaturesRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("optionalfeature", OPT_FEATURES_STORE_KEY);
}

/**
 * Returns raw race + subrace entries from the GTMH JSON (merged).
 * Subraces include Dragonborn elder-dragon variants and AGMH subraces (Felyne, etc.).
 */
export async function getRacesRaw(): Promise<unknown[]> {
  const race = await ensureGtmhArrayStore("race", RACE_STORE_KEY);
  const subrace = await ensureGtmhArrayStore("subrace", SUBRACE_STORE_KEY);
  return [...race, ...subrace];
}

/**
 * Returns the raw background array from the GTMH JSON.
 * Lazy-populates from remote if not yet cached.
 */
export async function getBackgroundsRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("background", BACKGROUND_STORE_KEY);
}

/**
 * Returns the raw feat array from the GTMH JSON.
 * Lazy-populates from remote if not yet cached.
 */
export async function getFeatsRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("feat", FEAT_STORE_KEY);
}

/**
 * Returns the raw variantrule array from the GTMH JSON.
 * Lazy-populates from remote if not yet cached.
 */
/**
 * Returns the raw class array from the GTMH JSON.
 * Lazy-populates from remote if not yet cached.
 */
export async function getClassesRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("class", CLASS_STORE_KEY);
}

/**
 * Returns the raw classFeature array from the GTMH JSON (Monstie Sidekick features).
 * Lazy-populates from remote if not yet cached.
 */
export async function getClassFeaturesRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("classFeature", CLASS_FEATURE_STORE_KEY);
}

export async function getVariantRulesRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("variantrule", VARIANT_RULE_STORE_KEY);
}

/**
 * Returns the raw object array from the GTMH JSON (siege weapons, etc.).
 * Lazy-populates from remote if not yet cached.
 */
export async function getObjectsRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("object", OBJECT_STORE_KEY);
}

/**
 * Returns the raw bookData object from the GTMH JSON (chapter content).
 * Lazy-populates from remote if not yet cached.
 */
export async function getBookDataRaw(): Promise<Record<string, unknown>> {
  const cached = await getStoreValue<Record<string, unknown>>(
    "GTMH_CURRENT",
    BOOK_DATA_STORE_KEY,
  );
  if (cached && Object.keys(cached).length > 0) return cached;

  try {
    const json = await fetchGtmhJsonOnce();
    const data =
      json.bookData && typeof json.bookData === "object"
        ? (json.bookData as Record<string, unknown>)
        : {};
    await setStoreValue("GTMH_CURRENT", BOOK_DATA_STORE_KEY, data);
    return data;
  } catch {
    return {};
  }
}
