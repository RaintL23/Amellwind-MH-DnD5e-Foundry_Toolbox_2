import { Rune } from "@/shared/types";
import { getMonsterData, clearMonsterDataCache } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapRunesFromMonster } from "../mappers/rune.mapper";

const service = createEntityService<Rune, Rune>({
  loadRaw: async () => {
    const rawData = (await getMonsterData()) as unknown[];
    const runes: Rune[] = [];
    for (const rawMonster of rawData) {
      runes.push(...mapRunesFromMonster(rawMonster));
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
