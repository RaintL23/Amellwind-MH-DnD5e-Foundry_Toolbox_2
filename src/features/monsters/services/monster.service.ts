import { Monster } from "@/shared/types";
import { getMonsterData, clearMonsterDataCache } from "@/shared/db/sync.service";
import { mapMonster } from "../mappers/monster.mapper";
import { parseMonsterId } from "../utils/monster-id.utils";

let cache: Monster[] | null = null;

export async function getAllMonsters(): Promise<Monster[]> {
  if (cache) return cache;

  const rawData = await getMonsterData();
  cache = (rawData as unknown[]).map((raw) => mapMonster(raw));
  return cache;
}

export async function getMonsterByName(name: string): Promise<Monster | undefined> {
  const monsters = await getAllMonsters();
  return monsters.find((m) => m.name === name);
}

export async function getMonsterById(monsterId: string): Promise<Monster | undefined> {
  const parsed = parseMonsterId(monsterId);
  if (!parsed) return undefined;
  const monsters = await getAllMonsters();
  return monsters.find(
    (m) => m.name === parsed.name && m.source === parsed.source,
  );
}

export async function getMonstersByGroup(group: string): Promise<Monster[]> {
  const monsters = await getAllMonsters();
  return monsters.filter((m) => m.group?.includes(group));
}

export function clearMonsterCache(): void {
  cache = null;
  clearMonsterDataCache();
}
