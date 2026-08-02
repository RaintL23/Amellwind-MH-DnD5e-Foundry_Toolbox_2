/**
 * Loads 5etools fluff (class / subclass / race / background / spell / item /
 * feat) for Foundry export so items get lore HTML + art instead of stubs.
 */

import {
  CLASS_FLUFF_INDEX_URL,
  CLASSES_BASE_URL,
  FLUFF_BACKGROUNDS_JSON_URL,
  FLUFF_FEATS_JSON_URL,
  FLUFF_ITEMS_JSON_URL,
  FLUFF_RACES_JSON_URL,
  SPELL_FLUFF_INDEX_URL,
  SPELLS_BASE_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import {
  fluffToFoundryHtml,
  resolveFluffImageUrl,
  type FluffArtResult,
} from "./fluff-description";

type RawFluff = Record<string, unknown> & {
  name?: string;
  source?: string;
  shortName?: string;
  className?: string;
  classSource?: string;
  entries?: unknown[];
  images?: unknown[];
};

let classFluffIndex: Record<string, string> | null = null;
const classFluffCache = new Map<string, RawFluff[]>();
let raceFluffIndex: Map<string, RawFluff> | null = null;
let backgroundFluffIndex: Map<string, RawFluff> | null = null;

let spellFluffIndex: Record<string, string> | null = null;
const spellFluffFileCache = new Map<string, RawFluff[]>();
let spellImgByKey: Map<string, string> | null = null;
let spellImgByName: Map<string, string> | null = null;

let itemImgByKey: Map<string, string> | null = null;
let itemImgByName: Map<string, string> | null = null;
let featImgByKey: Map<string, string> | null = null;
let featImgByName: Map<string, string> | null = null;

function key(name: string, source: string): string {
  return `${name}|${source}`.toLowerCase();
}

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

async function loadClassFluffIndex(): Promise<Record<string, string>> {
  if (classFluffIndex) return classFluffIndex;
  try {
    classFluffIndex = await fetchFiveToolsJson<Record<string, string>>(
      CLASS_FLUFF_INDEX_URL,
      "class/fluff-index.json",
    );
  } catch {
    classFluffIndex = {};
  }
  return classFluffIndex;
}

async function loadClassFluffFile(fileName: string): Promise<RawFluff[]> {
  const cached = classFluffCache.get(fileName);
  if (cached) return cached;

  try {
    const doc = await fetchFiveToolsJson<{
      classFluff?: RawFluff[];
      subclassFluff?: RawFluff[];
    }>(`${CLASSES_BASE_URL}/${fileName}`, `class/${fileName}`);
    const merged = [
      ...(Array.isArray(doc.classFluff) ? doc.classFluff : []),
      ...(Array.isArray(doc.subclassFluff) ? doc.subclassFluff : []),
    ];
    const resolved = resolveByNameSource(
      merged.filter(
        (e): e is RawFluff & { name: string; source: string } =>
          typeof e.name === "string" && typeof e.source === "string",
      ),
    );
    classFluffCache.set(fileName, resolved);
    return resolved;
  } catch {
    classFluffCache.set(fileName, []);
    return [];
  }
}

async function getClassFluffEntries(className: string): Promise<RawFluff[]> {
  const index = await loadClassFluffIndex();
  const file = index[className.trim().toLowerCase()];
  if (!file) return [];
  return loadClassFluffFile(file);
}

async function loadRaceFluffIndex(): Promise<Map<string, RawFluff>> {
  if (raceFluffIndex) return raceFluffIndex;
  try {
    const data = await fetchFiveToolsJson<{ raceFluff?: RawFluff[] }>(
      FLUFF_RACES_JSON_URL,
      "fluff-races.json",
    );
    const raw = Array.isArray(data.raceFluff) ? data.raceFluff : [];
    const resolved = resolveByNameSource(
      raw.filter(
        (e): e is RawFluff & { name: string; source: string } =>
          typeof e.name === "string" && typeof e.source === "string",
      ),
    );
    raceFluffIndex = new Map(
      resolved.map((e) => [key(e.name, e.source), e]),
    );
  } catch {
    raceFluffIndex = new Map();
  }
  return raceFluffIndex;
}

async function loadBackgroundFluffIndex(): Promise<Map<string, RawFluff>> {
  if (backgroundFluffIndex) return backgroundFluffIndex;
  try {
    const data = await fetchFiveToolsJson<{ backgroundFluff?: RawFluff[] }>(
      FLUFF_BACKGROUNDS_JSON_URL,
      "fluff-backgrounds.json",
    );
    const raw = Array.isArray(data.backgroundFluff) ? data.backgroundFluff : [];
    const resolved = resolveByNameSource(
      raw.filter(
        (e): e is RawFluff & { name: string; source: string } =>
          typeof e.name === "string" && typeof e.source === "string",
      ),
    );
    backgroundFluffIndex = new Map(
      resolved.map((e) => [key(e.name, e.source), e]),
    );
  } catch {
    backgroundFluffIndex = new Map();
  }
  return backgroundFluffIndex;
}

function toArt(fluff: RawFluff | undefined): FluffArtResult {
  if (!fluff) return { html: "" };
  return fluffToFoundryHtml(fluff);
}

function indexFluffImages(
  entries: RawFluff[],
): { byKey: Map<string, string>; byName: Map<string, string> } {
  const byKey = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const entry of entries) {
    if (typeof entry.name !== "string" || typeof entry.source !== "string") {
      continue;
    }
    const url = resolveFluffImageUrl(entry.images);
    if (!url) continue;
    byKey.set(key(entry.name, entry.source), url);
    const nk = nameKey(entry.name);
    if (!byName.has(nk)) byName.set(nk, url);
  }
  return { byKey, byName };
}

async function loadSpellFluffFile(fileName: string): Promise<RawFluff[]> {
  const cached = spellFluffFileCache.get(fileName);
  if (cached) return cached;
  try {
    const doc = await fetchFiveToolsJson<{ spellFluff?: RawFluff[] }>(
      `${SPELLS_BASE_URL}/${fileName}`,
      `spells/${fileName}`,
    );
    const raw = Array.isArray(doc.spellFluff) ? doc.spellFluff : [];
    const resolved = resolveByNameSource(
      raw.filter(
        (e): e is RawFluff & { name: string; source: string } =>
          typeof e.name === "string" && typeof e.source === "string",
      ),
    );
    spellFluffFileCache.set(fileName, resolved);
    return resolved;
  } catch {
    spellFluffFileCache.set(fileName, []);
    return [];
  }
}

/** Loads all spell fluff art maps (name|source and name-only). */
async function ensureSpellImgMaps(): Promise<void> {
  if (spellImgByKey && spellImgByName) return;
  const byKey = new Map<string, string>();
  const byName = new Map<string, string>();
  try {
    if (!spellFluffIndex) {
      spellFluffIndex = await fetchFiveToolsJson<Record<string, string>>(
        SPELL_FLUFF_INDEX_URL,
        "spells/fluff-index.json",
      );
    }
    const files = [...new Set(Object.values(spellFluffIndex ?? {}))];
    const batches = await Promise.all(files.map(loadSpellFluffFile));
    for (const entries of batches) {
      const indexed = indexFluffImages(entries);
      for (const [k, v] of indexed.byKey) byKey.set(k, v);
      for (const [k, v] of indexed.byName) {
        if (!byName.has(k)) byName.set(k, v);
      }
    }
  } catch {
    // leave empty maps
  }
  spellImgByKey = byKey;
  spellImgByName = byName;
}

async function ensureItemImgMaps(): Promise<void> {
  if (itemImgByKey && itemImgByName) return;
  try {
    const data = await fetchFiveToolsJson<{ itemFluff?: RawFluff[] }>(
      FLUFF_ITEMS_JSON_URL,
      "fluff-items.json",
    );
    const raw = Array.isArray(data.itemFluff) ? data.itemFluff : [];
    const resolved = resolveByNameSource(
      raw.filter(
        (e): e is RawFluff & { name: string; source: string } =>
          typeof e.name === "string" && typeof e.source === "string",
      ),
    );
    const indexed = indexFluffImages(resolved);
    itemImgByKey = indexed.byKey;
    itemImgByName = indexed.byName;
  } catch {
    itemImgByKey = new Map();
    itemImgByName = new Map();
  }
}

async function ensureFeatImgMaps(): Promise<void> {
  if (featImgByKey && featImgByName) return;
  try {
    const data = await fetchFiveToolsJson<{ featFluff?: RawFluff[] }>(
      FLUFF_FEATS_JSON_URL,
      "fluff-feats.json",
    );
    const raw = Array.isArray(data.featFluff) ? data.featFluff : [];
    const resolved = resolveByNameSource(
      raw.filter(
        (e): e is RawFluff & { name: string; source: string } =>
          typeof e.name === "string" && typeof e.source === "string",
      ),
    );
    const indexed = indexFluffImages(resolved);
    featImgByKey = indexed.byKey;
    featImgByName = indexed.byName;
  } catch {
    featImgByKey = new Map();
    featImgByName = new Map();
  }
}

function lookupImg(
  byKey: Map<string, string> | null,
  byName: Map<string, string> | null,
  name: string,
  source?: string,
): string | undefined {
  if (!byKey || !byName) return undefined;
  if (source) {
    const exact = byKey.get(key(name, source));
    if (exact) return exact;
  }
  return byName.get(nameKey(name));
}

/** Resolves class fluff (lore + art) for Foundry identity export. */
export async function resolveClassFluffForFoundry(
  name: string,
  source: string,
): Promise<FluffArtResult> {
  const entries = await getClassFluffEntries(name);
  const exact = entries.find(
    (e) =>
      e.name?.toLowerCase() === name.toLowerCase() &&
      e.source?.toLowerCase() === source.toLowerCase() &&
      !e.shortName &&
      !e.className,
  );
  if (exact) return toArt(exact);
  const byName = entries.find(
    (e) =>
      e.name?.toLowerCase() === name.toLowerCase() &&
      !e.shortName &&
      !e.className,
  );
  return toArt(byName);
}

/** Resolves subclass fluff for Foundry identity export. */
export async function resolveSubclassFluffForFoundry(
  name: string,
  source: string,
  className: string,
  classSource?: string,
): Promise<FluffArtResult> {
  const entries = await getClassFluffEntries(className);
  const lowerName = name.toLowerCase();
  const lowerSource = source.toLowerCase();
  const lowerClass = className.toLowerCase();

  const exact = entries.find((e) => {
    if (e.name?.toLowerCase() !== lowerName) return false;
    if (e.source?.toLowerCase() !== lowerSource) return false;
    if (e.className && e.className.toLowerCase() !== lowerClass) return false;
    if (
      classSource &&
      e.classSource &&
      e.classSource.toLowerCase() !== classSource.toLowerCase()
    ) {
      return false;
    }
    return true;
  });
  if (exact) return toArt(exact);

  const byName = entries.find(
    (e) =>
      e.name?.toLowerCase() === lowerName &&
      (!e.className || e.className.toLowerCase() === lowerClass),
  );
  return toArt(byName);
}

/**
 * Resolves race/species fluff. Falls back to parent race when the selected
 * lineage has no own lore (common for PHB subraces).
 */
export async function resolveRaceFluffForFoundry(
  name: string,
  source: string,
  parentName?: string,
  parentSource?: string,
): Promise<FluffArtResult> {
  const index = await loadRaceFluffIndex();
  const exact = index.get(key(name, source));
  if (exact && ((exact.entries?.length ?? 0) > 0 || (exact.images?.length ?? 0) > 0)) {
    return toArt(exact);
  }
  if (parentName && parentSource) {
    const parent = index.get(key(parentName, parentSource));
    if (parent) return toArt(parent);
  }
  // Same-name fallback across sources (e.g. reprinted species).
  for (const [k, fluff] of index) {
    if (k.startsWith(`${name.toLowerCase()}|`)) return toArt(fluff);
  }
  return toArt(exact);
}

/** Resolves background fluff art (text may already be mapped on the entity). */
export async function resolveBackgroundFluffForFoundry(
  name: string,
  source: string,
): Promise<FluffArtResult> {
  const index = await loadBackgroundFluffIndex();
  return toArt(index.get(key(name, source)));
}

/** Sync lookup after `prefetchFoundryEntityFluffImgs()` (or any resolve* call). */
export function getSpellFluffImgSync(
  name: string,
  source?: string,
): string | undefined {
  return lookupImg(spellImgByKey, spellImgByName, name, source);
}

/** Sync lookup after `prefetchFoundryEntityFluffImgs()` (or any resolve* call). */
export function getItemFluffImgSync(
  name: string,
  source?: string,
): string | undefined {
  return lookupImg(itemImgByKey, itemImgByName, name, source);
}

/** Sync lookup after `prefetchFoundryEntityFluffImgs()` (or any resolve* call). */
export function getFeatFluffImgSync(
  name: string,
  source?: string,
): string | undefined {
  return lookupImg(featImgByKey, featImgByName, name, source);
}

/** First fluff art URL for a spell (5etools CDN), if any. */
export async function resolveSpellFluffImg(
  name: string,
  source?: string,
): Promise<string | undefined> {
  await ensureSpellImgMaps();
  return getSpellFluffImgSync(name, source);
}

/** First fluff art URL for an item (5etools CDN), if any. */
export async function resolveItemFluffImg(
  name: string,
  source?: string,
): Promise<string | undefined> {
  await ensureItemImgMaps();
  return getItemFluffImgSync(name, source);
}

/** First fluff art URL for a feat (5etools CDN), if any. */
export async function resolveFeatFluffImg(
  name: string,
  source?: string,
): Promise<string | undefined> {
  await ensureFeatImgMaps();
  return getFeatFluffImgSync(name, source);
}

/**
 * Prefetches spell / item / feat fluff image indexes so per-entity lookups are
 * synchronous after this call (still async API for callers).
 */
export async function prefetchFoundryEntityFluffImgs(): Promise<void> {
  await Promise.all([
    ensureSpellImgMaps(),
    ensureItemImgMaps(),
    ensureFeatImgMaps(),
  ]);
}

/** Clears in-memory fluff caches (tests / after sync). */
export function clearFoundryFluffCache(): void {
  classFluffIndex = null;
  classFluffCache.clear();
  raceFluffIndex = null;
  backgroundFluffIndex = null;
  spellFluffIndex = null;
  spellFluffFileCache.clear();
  spellImgByKey = null;
  spellImgByName = null;
  itemImgByKey = null;
  itemImgByName = null;
  featImgByKey = null;
  featImgByName = null;
}
