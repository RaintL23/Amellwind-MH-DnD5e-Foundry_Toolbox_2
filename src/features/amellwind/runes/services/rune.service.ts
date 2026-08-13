import { Rune } from "@/shared/types";
import { getMonsterData, clearMonsterDataCache } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { getAllSpells } from "@/features/dnd/spells/services/spell.service";
import { mapRunesFromMonster } from "../mappers/rune.mapper";
import { buildSpellLevelLookup } from "../utils/spell-level-lookup.utils";

const service = createEntityService<Rune, Rune>({
  loadRaw: async () => {
    const [rawData, spells] = await Promise.all([
      getMonsterData(),
      getAllSpells().catch(() => [] as Awaited<ReturnType<typeof getAllSpells>>),
    ]);
    const spellLevels = buildSpellLevelLookup(spells);
    const runes: Rune[] = [];
    for (const rawMonster of rawData) {
      runes.push(...mapRunesFromMonster(rawMonster, spellLevels));
    }
    return runes;
  },
  map: (rune) => rune,
});

export const getAllRunes = service.getAll;

export async function getRunesByMonster(monsterName: string): Promise<Rune[]> {
  const runes = await service.getAll();
  return runes.filter((r) => r.monsterName === monsterName);
}

export async function getRuneByName(name: string): Promise<Rune | undefined> {
  const runes = await service.getAll();
  return runes.find((r) => r.name === name);
}

export function clearRuneCache(): void {
  service.clearCache();
  clearMonsterDataCache();
}
