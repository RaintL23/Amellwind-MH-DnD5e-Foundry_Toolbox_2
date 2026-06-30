import { Spell } from "@/shared/types";
import {
  SPELLS_BASE_URL,
  SPELL_SOURCE_FILES,
  SPELL_SOURCE_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import {
  bySource,
  createEntityService,
} from "@/shared/services/create-entity-service";
import { mapSpell } from "../mappers/spell.mapper";
import type { SpellSourceLookup } from "../utils/spell-lookup.types";
import { mutateSpellFromLookup } from "../utils/spell-lookup.mutator";
import { dedupeSpellsByName } from "../utils/spell-dedupe.utils";

type RawSpellEntry = Record<string, unknown>;

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

const service = createEntityService<RawSpellEntry, Spell>({
  loadRaw: async () => {
    const lookup = await getSpellSourceLookup();

    const results = await Promise.all(
      Object.values(SPELL_SOURCE_FILES).map((file) =>
        fetchFiveToolsJson<{ spell?: unknown[] }>(
          `${SPELLS_BASE_URL}/${file}`,
          `spells/${file}`,
        ).catch(() => ({ spell: [] })),
      ),
    );

    return results.flatMap((data) =>
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
