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

interface DataMeta {
  timestamp: number;
  url: string;
}

interface SyncResult {
  mmData: unknown[] | null;
  gtmhData: unknown | null;
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

    // Guardar copia anterior antes de reemplazar
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

export async function syncData(): Promise<SyncResult> {
  const mmFresh = await isDataFresh("MM_META");
  const gtmhFresh = await isDataFresh("GTMH_META");

  let mmData: unknown[] | null = null;
  let gtmhData: unknown | null = null;

  // Sincronizar Monster Manual
  if (!mmFresh) {
    const fetched = await fetchAndCache(
      MONSTER_MANUAL_URL,
      "MM_CURRENT",
      "MM_PREVIOUS",
      "MM_META",
      "monster",
    );
    if (fetched !== null) {
      mmData = fetched as unknown[];
    } else {
      // Fallback a datos locales
      mmData = (await getStoreValue<unknown[]>("MM_CURRENT", "data")) ?? null;
    }
  } else {
    mmData = (await getStoreValue<unknown[]>("MM_CURRENT", "data")) ?? null;
  }

  // Sincronizar Guía de Caza
  if (!gtmhFresh) {
    const fetched = await fetchAndCache(
      GUIDE_TO_MONSTER_HUNTING_URL,
      "GTMH_CURRENT",
      "GTMH_PREVIOUS",
      "GTMH_META",
      "item",
      async (json) => {
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
          await setStoreValue(
            "GTMH_CURRENT",
            BACKGROUND_STORE_KEY,
            json.background,
          );
        }
        if (Array.isArray(json.feat)) {
          await setStoreValue("GTMH_CURRENT", FEAT_STORE_KEY, json.feat);
        }
        if (Array.isArray(json.variantrule)) {
          await setStoreValue(
            "GTMH_CURRENT",
            VARIANT_RULE_STORE_KEY,
            json.variantrule,
          );
        }
      },
    );
    if (fetched !== null) {
      gtmhData = fetched;
    } else {
      gtmhData = (await getStoreValue<unknown>("GTMH_CURRENT", "data")) ?? null;
    }
  } else {
    gtmhData = (await getStoreValue<unknown>("GTMH_CURRENT", "data")) ?? null;
  }

  return { mmData, gtmhData };
}

export async function getMonsterData(): Promise<unknown[]> {
  const data = await getStoreValue<unknown[]>("MM_CURRENT", "data");
  return data ?? [];
}

export async function getGtmhData(): Promise<unknown> {
  return getStoreValue<unknown>("GTMH_CURRENT", "data");
}

/**
 * Returns the raw optionalfeature array from the GTMH JSON.
 * If not yet cached (first load after upgrade), fetches lazily from the remote URL.
 */
export async function getOptionalFeaturesRaw(): Promise<unknown[]> {
  const cached = await getStoreValue<unknown[]>(
    "GTMH_CURRENT",
    OPT_FEATURES_STORE_KEY,
  );
  if (cached && cached.length > 0) return cached;

  // Lazy-populate for users that already have GTMH items cached but not optfeatures
  try {
    const response = await fetch(GUIDE_TO_MONSTER_HUNTING_URL);
    if (!response.ok) return [];
    const json = (await response.json()) as Record<string, unknown>;
    const data: unknown[] = Array.isArray(json.optionalfeature)
      ? (json.optionalfeature as unknown[])
      : [];
    await setStoreValue("GTMH_CURRENT", OPT_FEATURES_STORE_KEY, data);
    return data;
  } catch {
    return [];
  }
}

async function fetchGtmhSpeciesArrays(): Promise<{
  race: unknown[];
  subrace: unknown[];
}> {
  const response = await fetch(GUIDE_TO_MONSTER_HUNTING_URL);
  if (!response.ok) return { race: [], subrace: [] };
  const json = (await response.json()) as Record<string, unknown>;
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
  const cached = await getStoreValue<unknown[]>(
    "GTMH_CURRENT",
    BACKGROUND_STORE_KEY,
  );
  if (cached && cached.length > 0) return cached;

  try {
    const response = await fetch(GUIDE_TO_MONSTER_HUNTING_URL);
    if (!response.ok) return [];
    const json = (await response.json()) as Record<string, unknown>;
    const data: unknown[] = Array.isArray(json.background)
      ? (json.background as unknown[])
      : [];
    await setStoreValue("GTMH_CURRENT", BACKGROUND_STORE_KEY, data);
    return data;
  } catch {
    return [];
  }
}

/**
 * Returns the raw feat array from the GTMH JSON.
 * Lazy-populates from remote if not yet cached.
 */
export async function getFeatsRaw(): Promise<unknown[]> {
  const cached = await getStoreValue<unknown[]>("GTMH_CURRENT", FEAT_STORE_KEY);
  if (cached && cached.length > 0) return cached;

  try {
    const response = await fetch(GUIDE_TO_MONSTER_HUNTING_URL);
    if (!response.ok) return [];
    const json = (await response.json()) as Record<string, unknown>;
    const data: unknown[] = Array.isArray(json.feat)
      ? (json.feat as unknown[])
      : [];
    await setStoreValue("GTMH_CURRENT", FEAT_STORE_KEY, data);
    return data;
  } catch {
    return [];
  }
}

/**
 * Returns the raw variantrule array from the GTMH JSON.
 * Lazy-populates from remote if not yet cached.
 */
export async function getVariantRulesRaw(): Promise<unknown[]> {
  const cached = await getStoreValue<unknown[]>(
    "GTMH_CURRENT",
    VARIANT_RULE_STORE_KEY,
  );
  if (cached && cached.length > 0) return cached;

  try {
    const response = await fetch(GUIDE_TO_MONSTER_HUNTING_URL);
    if (!response.ok) return [];
    const json = (await response.json()) as Record<string, unknown>;
    const data: unknown[] = Array.isArray(json.variantrule)
      ? (json.variantrule as unknown[])
      : [];
    await setStoreValue("GTMH_CURRENT", VARIANT_RULE_STORE_KEY, data);
    return data;
  } catch {
    return [];
  }
}
