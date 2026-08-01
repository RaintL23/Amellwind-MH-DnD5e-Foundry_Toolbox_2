import { Spell } from "@/shared/types";
import {
  SPELLS_BASE_URL,
  SPELL_INDEX_URL,
  SPELL_SOURCE_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import {
  bySource,
  createEntityService,
} from "@/shared/services/create-entity-service";
import {
  collectUaPropEntries,
  loadUaBrewDocuments,
} from "@/shared/services/ua-brew.service";
import {
  getSourceCatalog,
  isOnDemandBrewSourceKind,
} from "@/shared/services/source-catalog.service";
import { mapSpell } from "../mappers/spell.mapper";
import type { SpellSourceLookup } from "../utils/spell-lookup.types";
import { mutateSpellFromLookup } from "../utils/spell-lookup.mutator";
import { dedupeSpellsByName } from "../utils/spell-dedupe.utils";

type RawSpellEntry = Record<string, unknown>;

/** UA/DDB source codes whose brew files have been requested into the pool. */
const loadedUaSources = new Set<string>();

async function getSpellSourceLookup(): Promise<SpellSourceLookup> {
  try {
    return await fetchFiveToolsJson<SpellSourceLookup>(
      SPELL_SOURCE_LOOKUP_URL,
      "generated/gendata-spell-source-lookup.json",
    );
  } catch {
    return {};
  }
}

async function loadOfficialSpellIndex(): Promise<Record<string, string>> {
  try {
    return await fetchFiveToolsJson<Record<string, string>>(
      SPELL_INDEX_URL,
      "spells/index.json",
    );
  } catch {
    return {};
  }
}

const service = createEntityService<RawSpellEntry, Spell>({
  loadRaw: async () => {
    const [lookup, index] = await Promise.all([
      getSpellSourceLookup(),
      loadOfficialSpellIndex(),
    ]);

    const officialFiles = Object.values(index);
    const officialResults = await Promise.all(
      officialFiles.map((file) =>
        fetchFiveToolsJson<{ spell?: unknown[] }>(
          `${SPELLS_BASE_URL}/${file}`,
          `spells/${file}`,
        ).catch(() => ({ spell: [] })),
      ),
    );

    const officialRaw = officialResults.flatMap((data) =>
      Array.isArray(data.spell)
        ? data.spell.map(
            (raw) =>
              mutateSpellFromLookup(
                { ...(raw as object) },
                lookup,
              ) as RawSpellEntry,
          )
        : [],
    );

    let uaRaw: RawSpellEntry[] = [];
    if (loadedUaSources.size > 0) {
      const docs = await loadUaBrewDocuments(loadedUaSources);
      uaRaw = collectUaPropEntries<RawSpellEntry>(docs, "spell").map(
        (raw) =>
          mutateSpellFromLookup({ ...raw }, lookup) as RawSpellEntry,
      );
    }

    return [...officialRaw, ...uaRaw];
  },
  map: (raw) => mapSpell(raw),
  idOf: (spell) => spell.id,
  nameOf: (spell) => spell.name,
  dedupe: dedupeSpellsByName,
  sortVariants: bySource,
});

export const getAllSpells = service.getAll;
export const getListSpells = service.getList;
export const getSpellsByName = service.getByName;
export const getSpellById = service.getById;
export const clearSpellCache = service.clearCache;

/** Ensure selected UA/DDB/partnered sources are merged into the spell pool. */
export async function ensureSpellUaSourcesLoaded(
  sourceCodes: string[],
): Promise<boolean> {
  const catalog = await getSourceCatalog();
  const needed = sourceCodes.filter((code) => {
    const kind = catalog.get(code)?.kind;
    return isOnDemandBrewSourceKind(kind) && !loadedUaSources.has(code);
  });
  if (needed.length === 0) return false;
  for (const code of needed) loadedUaSources.add(code);
  service.clearCache();
  await service.getAll();
  return true;
}

/** All source codes that can appear in the Spells filter (official index + UA). */
export async function getSpellFilterSourceCodes(): Promise<string[]> {
  const [index, catalog] = await Promise.all([
    loadOfficialSpellIndex(),
    getSourceCatalog(),
  ]);
  const codes = new Set<string>(Object.keys(index));
  for (const [code, entry] of catalog) {
    if (
      entry.uaPath &&
      (entry.uaPath.startsWith("spell/") ||
        entry.uaPath.startsWith("collection/"))
    ) {
      codes.add(code);
    }
  }
  return [...codes];
}

export function clearSpellUaLoadedSources(): void {
  loadedUaSources.clear();
}
