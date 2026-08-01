import { getStoreValue, setStoreValue } from "./database";
import {
  MONSTER_MANUAL_URL,
  GUIDE_TO_MONSTER_HUNTING_URL,
  CACHE_TTL_MS,
} from "../constants/api.constants";

const OPT_FEATURES_STORE_KEY = "optfeatures";
const RACE_STORE_KEY = "race";
const SUBRACE_STORE_KEY = "subrace";
const BACKGROUND_STORE_KEY = "background";
const FEAT_STORE_KEY = "feat";
const VARIANT_RULE_STORE_KEY = "variantrule";
const CLASS_FEATURE_STORE_KEY = "classFeature";
const CLASS_STORE_KEY = "class";
const BOOK_DATA_STORE_KEY = "bookData";
const CONDITION_STORE_KEY = "condition";
const DISEASE_STORE_KEY = "disease";

let mmRawCache: unknown[] | null = null;
let mmJsonPromise: Promise<Record<string, unknown>> | null = null;
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

async function fetchAndCache(
  url: string,
  currentStore: "MM_CURRENT" | "GTMH_CURRENT",
  previousStore: "MM_PREVIOUS" | "GTMH_PREVIOUS",
  metaStore: "MM_META" | "GTMH_META",
  dataKey: string,
  onFullJson?: (json: Record<string, unknown>) => Promise<void>,
): Promise<unknown | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = (await response.json()) as Record<string, unknown>;
    const newData = json[dataKey] ?? json;

    // Keep the previous copy before overwriting.
    const current = await getStoreValue(currentStore, "data");
    if (current !== undefined) {
      await setStoreValue(previousStore, "data", current);
    }

    await setStoreValue(currentStore, "data", newData);
    await setStoreValue(metaStore, "meta", {
      timestamp: Date.now(),
      url,
    } satisfies DataMeta);

    if (onFullJson) await onFullJson(json);

    return newData;
  } catch (error) {
    console.warn(`[SyncService] Fetch failed for ${url}:`, error);
    return null;
  }
}

/** Persist the derived MM sub-collections (conditions, diseases) from the full JSON. */
async function writeMmDerivedStores(
  json: Record<string, unknown>,
): Promise<void> {
  if (Array.isArray(json.condition)) {
    await setStoreValue("MM_CURRENT", CONDITION_STORE_KEY, json.condition);
  }
  if (Array.isArray(json.disease)) {
    await setStoreValue("MM_CURRENT", DISEASE_STORE_KEY, json.disease);
  }
}

/** Persist the derived GTMH sub-collections (species, backgrounds, feats, MH classes, …). */
async function writeGtmhDerivedStores(
  json: Record<string, unknown>,
): Promise<void> {
  if (Array.isArray(json.optionalfeature)) {
    await setStoreValue(
      "GTMH_CURRENT",
      OPT_FEATURES_STORE_KEY,
      json.optionalfeature,
    );
  }
  if (Array.isArray(json.race)) {
    await setStoreValue("GTMH_CURRENT", RACE_STORE_KEY, json.race);
  }
  if (Array.isArray(json.subrace)) {
    await setStoreValue("GTMH_CURRENT", SUBRACE_STORE_KEY, json.subrace);
  }
  if (Array.isArray(json.background)) {
    await setStoreValue("GTMH_CURRENT", BACKGROUND_STORE_KEY, json.background);
  }
  if (Array.isArray(json.feat)) {
    await setStoreValue("GTMH_CURRENT", FEAT_STORE_KEY, json.feat);
  }
  if (Array.isArray(json.variantrule)) {
    await setStoreValue("GTMH_CURRENT", VARIANT_RULE_STORE_KEY, json.variantrule);
  }
  if (Array.isArray(json.classFeature)) {
    await setStoreValue(
      "GTMH_CURRENT",
      CLASS_FEATURE_STORE_KEY,
      json.classFeature,
    );
  }
  if (Array.isArray(json.class)) {
    await setStoreValue("GTMH_CURRENT", CLASS_STORE_KEY, json.class);
  }
  if (json.bookData && typeof json.bookData === "object") {
    await setStoreValue("GTMH_CURRENT", BOOK_DATA_STORE_KEY, json.bookData);
  }
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

/** Background refresh of the Monster Manual feed; updates the stores for the next load. */
async function refreshMonsterManual(onUpdated?: OnDataUpdated): Promise<void> {
  if (mmRefreshInFlight) return;
  mmRefreshInFlight = true;
  try {
    const fetched = await fetchAndCache(
      MONSTER_MANUAL_URL,
      "MM_CURRENT",
      "MM_PREVIOUS",
      "MM_META",
      "monster",
      writeMmDerivedStores,
    );
    if (fetched !== null) {
      mmRawCache = null;
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
    const fetched = await fetchAndCache(
      GUIDE_TO_MONSTER_HUNTING_URL,
      "GTMH_CURRENT",
      "GTMH_PREVIOUS",
      "GTMH_META",
      "item",
      writeGtmhDerivedStores,
    );
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
        mmData = mmStored;
        if (!mmFresh) void refreshMonsterManual(onUpdated);
      } else {
        const fetched = await fetchAndCache(
          MONSTER_MANUAL_URL,
          "MM_CURRENT",
          "MM_PREVIOUS",
          "MM_META",
          "monster",
          writeMmDerivedStores,
        );
        if (fetched !== null) {
          mmData = fetched as unknown[];
          mmUpdated = true;
          mmRawCache = null;
          onUpdated?.({ mm: true, gtmh: false });
        }
      }
    })(),
    (async () => {
      if (gtmhStored !== undefined) {
        gtmhData = gtmhStored;
        if (!gtmhFresh) void refreshGuideToMonsterHunting(onUpdated);
      } else {
        const fetched = await fetchAndCache(
          GUIDE_TO_MONSTER_HUNTING_URL,
          "GTMH_CURRENT",
          "GTMH_PREVIOUS",
          "GTMH_META",
          "item",
          writeGtmhDerivedStores,
        );
        if (fetched !== null) {
          gtmhData = fetched;
          gtmhUpdated = true;
          onUpdated?.({ mm: false, gtmh: true });
        }
      }
    })(),
  ]);

  return { mmData, gtmhData, updated: { mm: mmUpdated, gtmh: gtmhUpdated } };
}

export async function getMonsterData(): Promise<unknown[]> {
  if (mmRawCache) return mmRawCache;
  const data = await getStoreValue<unknown[]>("MM_CURRENT", "data");
  mmRawCache = data ?? [];
  return mmRawCache;
}

export function clearMonsterDataCache(): void {
  mmRawCache = null;
}

async function fetchMmJsonOnce(): Promise<Record<string, unknown>> {
  if (!mmJsonPromise) {
    mmJsonPromise = fetch(MONSTER_MANUAL_URL)
      .then((response) =>
        response.ok
          ? (response.json() as Promise<Record<string, unknown>>)
          : ({} as Record<string, unknown>),
      )
      .catch(() => ({} as Record<string, unknown>));
  }
  return mmJsonPromise;
}

async function ensureMmArrayStore(
  jsonKey: string,
  storeKey: string,
): Promise<unknown[]> {
  const cached = await getStoreValue<unknown[]>("MM_CURRENT", storeKey);
  if (cached && cached.length > 0) return cached;

  try {
    const json = await fetchMmJsonOnce();
    const data: unknown[] = Array.isArray(json[jsonKey])
      ? (json[jsonKey] as unknown[])
      : [];
    if (data.length > 0) {
      await setStoreValue("MM_CURRENT", storeKey, data);
    }
    return data;
  } catch {
    return [];
  }
}

/**
 * Returns the raw condition array from the MHMM JSON.
 * Lazy-populates from remote if not yet cached.
 */
export async function getConditionsRaw(): Promise<unknown[]> {
  return ensureMmArrayStore("condition", CONDITION_STORE_KEY);
}

/**
 * Returns the raw disease array from the MHMM JSON.
 * Lazy-populates from remote if not yet cached.
 */
export async function getDiseasesRaw(): Promise<unknown[]> {
  return ensureMmArrayStore("disease", DISEASE_STORE_KEY);
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
  return getStoreValue<unknown>("GTMH_CURRENT", "data");
}

/**
 * Returns the raw optionalfeature array from the GTMH JSON.
 * If not yet cached (first load after upgrade), fetches lazily from the remote URL.
 */
export async function getOptionalFeaturesRaw(): Promise<unknown[]> {
  return ensureGtmhArrayStore("optionalfeature", OPT_FEATURES_STORE_KEY);
}

async function fetchGtmhSpeciesArrays(): Promise<{
  race: unknown[];
  subrace: unknown[];
}> {
  const json = await fetchGtmhJsonOnce();
  const race = Array.isArray(json.race) ? (json.race as unknown[]) : [];
  const subrace = Array.isArray(json.subrace) ? (json.subrace as unknown[]) : [];
  await setStoreValue("GTMH_CURRENT", RACE_STORE_KEY, race);
  await setStoreValue("GTMH_CURRENT", SUBRACE_STORE_KEY, subrace);
  return { race, subrace };
}

/**
 * Returns raw race + subrace entries from the GTMH JSON (merged).
 * Subraces include Dragonborn elder-dragon variants and AGMH subraces (Felyne, etc.).
 */
export async function getRacesRaw(): Promise<unknown[]> {
  let race =
    (await getStoreValue<unknown[]>("GTMH_CURRENT", RACE_STORE_KEY)) ?? [];
  let subrace =
    (await getStoreValue<unknown[]>("GTMH_CURRENT", SUBRACE_STORE_KEY)) ?? [];

  if (race.length > 0 && subrace.length > 0) {
    return [...race, ...subrace];
  }

  try {
    const fetched = await fetchGtmhSpeciesArrays();
    race = fetched.race;
    subrace = fetched.subrace;
  } catch {
    // use whatever partial cache exists
  }

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
