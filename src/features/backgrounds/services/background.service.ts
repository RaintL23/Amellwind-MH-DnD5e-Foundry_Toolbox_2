import { Background } from "@/shared/types";
import { getBackgroundsRaw } from "@/shared/db/sync.service";
import { mapBackground } from "../mappers/background.mapper";

let cache: Background[] | null = null;

export async function getAllBackgrounds(): Promise<Background[]> {
  if (cache) return cache;
  const rawData = await getBackgroundsRaw();
  cache = (rawData as unknown[]).map((raw) => mapBackground(raw));
  return cache;
}

export async function getBackgroundById(
  id: string,
): Promise<Background | undefined> {
  const all = await getAllBackgrounds();
  return all.find((b) => b.id === id);
}

export function clearBackgroundCache(): void {
  cache = null;
}
