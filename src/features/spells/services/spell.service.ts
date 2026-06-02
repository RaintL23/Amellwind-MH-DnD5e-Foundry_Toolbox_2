import { Spell } from "@/shared/types";
import {
  SPELLS_BASE_URL,
  SPELL_SOURCE_FILES,
  SPELL_SOURCE_LOOKUP_URL,
} from "@/shared/constants/api.constants";
import { mapSpell } from "../mappers/spell.mapper";
import type { SpellSourceLookup } from "../utils/spell-lookup.types";
import { mutateSpellFromLookup } from "../utils/spell-lookup.mutator";

let cache: Spell[] | null = null;
let lookupCache: SpellSourceLookup | null = null;

async function getSpellSourceLookup(): Promise<SpellSourceLookup> {
  if (lookupCache) return lookupCache;

  try {
    const res = await fetch(SPELL_SOURCE_LOOKUP_URL);
    if (!res.ok) throw new Error(`Failed to fetch spell lookup: ${res.status}`);
    lookupCache = (await res.json()) as SpellSourceLookup;
  } catch {
    lookupCache = {};
  }

  return lookupCache;
}

export async function getAllSpells(): Promise<Spell[]> {
  if (cache) return cache;

  const lookup = await getSpellSourceLookup();

  const urls = Object.values(SPELL_SOURCE_FILES).map(
    (file) => `${SPELLS_BASE_URL}/${file}`,
  );

  const results = await Promise.all(
    urls.map((url) =>
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
          return r.json();
        })
        .catch(() => ({ spell: [] })),
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache = results.flatMap((data: any) =>
    Array.isArray(data.spell)
      ? (data.spell as unknown[]).map((raw) => {
          const mutated = mutateSpellFromLookup(
            { ...(raw as object) },
            lookup,
          );
          return mapSpell(mutated);
        })
      : [],
  );

  return cache;
}

export async function getSpellById(id: string): Promise<Spell | undefined> {
  const all = await getAllSpells();
  return all.find((s) => s.id === id);
}

export function clearSpellCache(): void {
  cache = null;
  lookupCache = null;
}
