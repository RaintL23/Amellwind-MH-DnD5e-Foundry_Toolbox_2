import { Weapon } from "@/shared/types";
import { mapWeapon } from "../mappers/weapon.mapper";
import { getGtmhData } from "@/shared/db/sync.service";

let cache: Weapon[] | null = null;

export async function getAllWeapons(): Promise<Weapon[]> {
  if (cache) return cache;

  const raw = await getGtmhData();
  if (!raw || !Array.isArray(raw)) return [];

  cache = (raw as Record<string, unknown>[])
    .filter((item) => item.type === "HW")
    .map(mapWeapon);

  return cache;
}

export function clearWeaponCache(): void {
  cache = null;
}

export function formatWeaponValue(valueCp: number): string {
  const gp = valueCp / 100;
  if (gp >= 1000) return `${gp.toLocaleString("en-US")} gp`;
  return `${gp} gp`;
}
