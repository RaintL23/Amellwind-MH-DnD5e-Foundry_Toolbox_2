import { Monster } from "@/shared/types";
import { getMonsterData, clearMonsterDataCache } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapMonster } from "../mappers/monster.mapper";
import { parseMonsterId } from "../utils/monster-id.utils";

const service = createEntityService<unknown, Monster>({
  loadRaw: async () => (await getMonsterData()) as unknown[],
  map: (raw) => mapMonster(raw),
});

export const getAllMonsters = service.getAll;

export async function getMonsterByName(
  name: string,
): Promise<Monster | undefined> {
  const monsters = await service.getAll();
  return monsters.find((m) => m.name === name);
}

export async function getMonsterById(
  monsterId: string,
): Promise<Monster | undefined> {
  const parsed = parseMonsterId(monsterId);
  if (!parsed) return undefined;
  const monsters = await service.getAll();
  return monsters.find(
    (m) => m.name === parsed.name && m.source === parsed.source,
  );
}

export async function getMonstersByGroup(group: string): Promise<Monster[]> {
  const monsters = await service.getAll();
  return monsters.filter((m) => m.group?.includes(group));
}

export function clearMonsterCache(): void {
  service.clearCache();
  clearMonsterDataCache();
}
