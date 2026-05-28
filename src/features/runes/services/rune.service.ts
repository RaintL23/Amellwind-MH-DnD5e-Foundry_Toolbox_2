import { Rune } from "@/shared/types";
import { getMonsterData } from "@/shared/db/sync.service";
import { mapRunesFromMonster } from "../mappers/rune.mapper";

let cache: Rune[] | null = null;

export async function getAllRunes(): Promise<Rune[]> {
  if (cache) return cache;

  const rawData = await getMonsterData();
  const runes: Rune[] = [];
  let count1 = 0;
  let count2 = 0;
  for (const rawMonster of rawData as unknown[]) {
    count1++;
    const monsterRunes = mapRunesFromMonster(rawMonster);
    if (monsterRunes.length > 0) {
      count2++;
    }
    runes.push(...monsterRunes);
  }
  console.log(count1);
  console.log(count2);

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
}
