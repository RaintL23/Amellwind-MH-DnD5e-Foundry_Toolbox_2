/**
 * Rune data service — loads MHMM monsters from IndexedDB, maps loot rows to `Rune`,
 * caches in memory via `createEntityService`.
 *
 * Tag extraction runs at map time (inside `mapRunesFromMonster`); the list UI reads
 * precomputed `tags` / `weaponTags` / `armorTags` — it does not re-parse effect text.
 */
import { Rune } from "@/shared/types";
import { getMonsterData, clearMonsterDataCache } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { getAllSpells } from "@/features/dnd/spells/services/spell.service";
import { isPlaceableRune, mapRunesFromMonster, backfillSharedOtherEffects } from "../mappers/rune.mapper";
import { buildSpellLevelLookup } from "../utils/spell-level-lookup.utils";

// ─── Entity service (in-memory cache + dedupe) ───────────────────────────────
const service = createEntityService<Rune, Rune>({
  loadRaw: async () => {
    // Spell catalog lookup improves `mechanic:spell:lvlN` tag accuracy.
    const [rawData, spells] = await Promise.all([
      getMonsterData(),
      getAllSpells().catch(() => [] as Awaited<ReturnType<typeof getAllSpells>>),
    ]);
    const spellLevels = buildSpellLevelLookup(spells);
    const runes: Rune[] = [];
    for (const rawMonster of rawData) {
      runes.push(...mapRunesFromMonster(rawMonster, spellLevels));
    }
    // Copy shared O-slot `otherEffect` text onto rows that omit it on some sheets.
    return backfillSharedOtherEffects(runes);
  },
  map: (rune) => rune,
});

/** Placeable A/W runes only (excludes loot slot "O" upgrade/craft materials). */
export async function getAllRunes(): Promise<Rune[]> {
  const all = await service.getAll();
  return all.filter(isPlaceableRune);
}

/** Full loot-table materials for a monster, including non-placeable "O" rows. */
export async function getRunesByMonster(monsterName: string): Promise<Rune[]> {
  const runes = await service.getAll();
  return runes.filter((r) => r.monsterName === monsterName);
}

export async function getRuneByName(name: string): Promise<Rune | undefined> {
  const runes = await getAllRunes();
  return runes.find((r) => r.name === name);
}

export function clearRuneCache(): void {
  service.clearCache();
  clearMonsterDataCache();
}
