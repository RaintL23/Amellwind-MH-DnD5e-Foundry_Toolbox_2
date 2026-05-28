import { openDB, DBSchema, IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION, STORES } from "../constants/api.constants";

interface ToolboxDBSchema extends DBSchema {
  mm_current: { key: string; value: unknown };
  mm_previous: { key: string; value: unknown };
  mm_meta: { key: string; value: unknown };
  gtmh_current: { key: string; value: unknown };
  gtmh_previous: { key: string; value: unknown };
  gtmh_meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<ToolboxDBSchema>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<ToolboxDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ToolboxDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const storeName of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(storeName as never)) {
            db.createObjectStore(storeName as never);
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getStoreValue<T>(
  storeName: keyof typeof STORES,
  key: string
): Promise<T | undefined> {
  const db = await getDatabase();
  return db.get(STORES[storeName] as never, key) as Promise<T | undefined>;
}

export async function setStoreValue(
  storeName: keyof typeof STORES,
  key: string,
  value: unknown
): Promise<void> {
  const db = await getDatabase();
  await db.put(STORES[storeName] as never, value as never, key);
}
