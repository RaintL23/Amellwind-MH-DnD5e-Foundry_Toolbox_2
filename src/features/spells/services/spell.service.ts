import { Spell } from "@/shared/types";
import {
  SPELLS_BASE_URL,
  SPELL_SOURCE_FILES,
  SPELL_SOURCE_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { mapSpell } from "../mappers/spell.mapper";
import type { SpellSourceLookup } from "../utils/spell-lookup.types";
import { mutateSpellFromLookup } from "../utils/spell-lookup.mutator";
import { dedupeSpellsByName } from "../utils/spell-dedupe.utils";

let cache: Spell[] | null = null;
let listCache: Spell[] | null = null;
let byNameIndex: Map<string, Spell[]> | null = null;
let lookupCache: SpellSourceLookup | null = null;

async function getSpellSourceLookup(): Promise<SpellSourceLookup> {
  if (lookupCache) return lookupCache;

  try {
    lookupCache = await fetchFiveToolsJson<SpellSourceLookup>(
      SPELL_SOURCE_LOOKUP_URL,
      "generated/gendata-spell-source-lookup.json",
    );
  } catch {
    lookupCache = {};
  }

  return lookupCache;
}

function buildIndexes(all: Spell[]): void {
  const byName = new Map<string, Spell[]>();
  for (const spell of all) {
    const group = byName.get(spell.name) ?? [];
    group.push(spell);
    byName.set(spell.name, group);
  }
  byNameIndex = byName;
  listCache = dedupeSpellsByName(all);
}

export async function getAllSpells(): Promise<Spell[]> {
  if (cache) return cache;

  const lookup = await getSpellSourceLookup();

  const results = await Promise.all(
    Object.values(SPELL_SOURCE_FILES).map((file) =>
      fetchFiveToolsJson<{ spell?: unknown[] }>(
        `${SPELLS_BASE_URL}/${file}`,
        `spells/${file}`,
      ).catch(() => ({ spell: [] })),
    ),
  );

  cache = results.flatMap((data) =>
    Array.isArray(data.spell)
      ? data.spell.map((raw) => {
          const mutated = mutateSpellFromLookup(
            { ...(raw as object) },
            lookup,
          );
          return mapSpell(mutated);
        })
      : [],
  );

  buildIndexes(cache);
  return cache;
}

export async function getListSpells(): Promise<Spell[]> {
  await getAllSpells();
  return listCache ?? [];
}

export async function getSpellsByName(name: string): Promise<Spell[]> {
  await getAllSpells();
  const group = byNameIndex?.get(name) ?? [];
  return [...group].sort((a, b) => a.source.localeCompare(b.source));
}

export async function getSpellById(id: string): Promise<Spell | undefined> {
  const all = await getAllSpells();
  return all.find((s) => s.id === id);
}

export function clearSpellCache(): void {
  cache = null;
  listCache = null;
  byNameIndex = null;
  lookupCache = null;
}
