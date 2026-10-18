/**
 * Randomizer source gate: only official D&D books published in 2024 or later
 * (XPHB, XDMG, EFA, FRHoF, …). 2014-era books, UA and partnered content are
 * never picked. Manual picks in the Library are not affected.
 */
import {
  isOfficialSourceSince,
  type SourceCatalogEntry,
} from "@/shared/services/source-catalog.service";
import type { RandomizerCatalogs } from "./randomize-context.types";

export type RandomizerSourceFilter = (source: string | null | undefined) => boolean;

export const RANDOMIZER_MIN_SOURCE_YEAR = 2024;

const KNOWN_SOURCES_STORAGE_KEY = "raintdm-builder-randomizer-2024-sources-v1";

export type SourceCodeStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): SourceCodeStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readKnownCodes(storage: SourceCodeStorage | null): Set<string> {
  if (!storage) return new Set();
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(KNOWN_SOURCES_STORAGE_KEY) ?? "[]",
    );
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((code): code is string => typeof code === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeKnownCodes(storage: SourceCodeStorage | null, codes: string[]): void {
  if (!storage) return;
  try {
    storage.setItem(KNOWN_SOURCES_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // Offline fallback still has the static 2024 list.
  }
}

/**
 * 2024+ gate. With a loaded catalog the valid codes are remembered locally, so
 * an offline run (empty catalog) still accepts every 2024+ book seen before,
 * plus the static `KNOWN_2024_RULES_SOURCES` list (source-catalog.service).
 */
export function createRandomizerSourceFilter(
  catalog: Map<string, SourceCatalogEntry>,
  storage: SourceCodeStorage | null = defaultStorage(),
): RandomizerSourceFilter {
  const remembered = new Set<string>();
  if (catalog.size > 0) {
    const codes = [...catalog.keys()].filter((code) =>
      isOfficialSourceSince(code, catalog, RANDOMIZER_MIN_SOURCE_YEAR),
    );
    writeKnownCodes(storage, codes);
  } else {
    for (const code of readKnownCodes(storage)) remembered.add(code);
  }

  const cache = new Map<string, boolean>();
  return (source) => {
    if (!source) return false;
    const cached = cache.get(source);
    if (cached !== undefined) return cached;
    const allowed =
      remembered.has(source) ||
      isOfficialSourceSince(source, catalog, RANDOMIZER_MIN_SOURCE_YEAR);
    cache.set(source, allowed);
    return allowed;
  };
}

export function filterBySource<T extends { source?: string }>(
  items: readonly T[],
  isAllowedSource: RandomizerSourceFilter,
): T[] {
  return items.filter((item) => isAllowedSource(item.source));
}

/** D&D catalogs restricted to 2024+ sources. Amellwind species/backgrounds are homebrew and kept. */
export function filterRandomizerCatalogs(
  catalogs: RandomizerCatalogs,
  isAllowedSource: RandomizerSourceFilter,
): RandomizerCatalogs {
  return {
    ...catalogs,
    classes: filterBySource(catalogs.classes, isAllowedSource),
    dndRaces: filterBySource(catalogs.dndRaces, isAllowedSource),
    dndBackgrounds: filterBySource(catalogs.dndBackgrounds, isAllowedSource),
    dndFeats: filterBySource(catalogs.dndFeats, isAllowedSource),
    allSpells: filterBySource(catalogs.allSpells, isAllowedSource),
    allOptionalFeatures: filterBySource(
      catalogs.allOptionalFeatures,
      isAllowedSource,
    ),
    allFeatCatalog: filterBySource(catalogs.allFeatCatalog, isAllowedSource),
    dndWeapons: filterBySource(catalogs.dndWeapons, isAllowedSource),
    dndArmors: filterBySource(catalogs.dndArmors, isAllowedSource),
  };
}
