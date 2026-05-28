import { Monster } from "@/shared/types";
import { getMonsterData } from "@/shared/db/sync.service";
import { mapMonster } from "../mappers/monster.mapper";

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

export async function getMonstersByGroup(group: string): Promise<Monster[]> {
  const monsters = await getAllMonsters();
  return monsters.filter((m) => m.group?.includes(group));
}

export function clearMonsterCache(): void {
  cache = null;
}
