import { getDatabase } from "@/shared/db/database";
import { STORES } from "@/shared/constants/api.constants";
import type { PlayCharacterRecord } from "../utils/play-character.types";

const STORE = STORES.PLAY_CHARACTERS;

export async function listPlayCharacters(): Promise<PlayCharacterRecord[]> {
  const db = await getDatabase();
  const all = (await db.getAll(STORE as never)) as PlayCharacterRecord[];
  return all
    .filter((r) => r && r.version === 1 && r.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPlayCharacter(
  id: string,
): Promise<PlayCharacterRecord | undefined> {
  const db = await getDatabase();
  return (await db.get(STORE as never, id)) as PlayCharacterRecord | undefined;
}

export async function savePlayCharacter(
  record: PlayCharacterRecord,
): Promise<void> {
  const db = await getDatabase();
  const toSave: PlayCharacterRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE as never, toSave as never, record.id);
}

export async function deletePlayCharacter(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(STORE as never, id);
}
