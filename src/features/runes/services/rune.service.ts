import { Rune } from "@/shared/types";
import { getMonsterData, clearMonsterDataCache } from "@/shared/db/sync.service";
import { mapRunesFromMonster } from "../mappers/rune.mapper";

let cache: Rune[] | null = null;

export async function getAllRunes(): Promise<Rune[]> {
  if (cache) return cache;

  const rawData = await getMonsterData();
  const runes: Rune[] = [];
  for (const rawMonster of rawData as unknown[]) {
    runes.push(...mapRunesFromMonster(rawMonster));
  }

  cache = runes;
  return cache;
}

export async function getRunesByMonster(monsterName: string): Promise<Rune[]> {
  const runes = await getAllRunes();
  return runes.filter((r) => r.monsterName === monsterName);
}

export async function getRuneByName(name: string): Promise<Rune | undefined> {
  const runes = await getAllRunes();
  return runes.find((r) => r.name === name);
}

export function clearRuneCache(): void {
  cache = null;
  clearMonsterDataCache();
}
