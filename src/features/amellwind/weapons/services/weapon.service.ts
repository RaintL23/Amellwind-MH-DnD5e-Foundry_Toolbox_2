import { Weapon } from "@/shared/types";
import { getGtmhData } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapWeapon } from "../mappers/weapon.mapper";

type RawWeaponEntry = Record<string, unknown>;

const service = createEntityService<RawWeaponEntry, Weapon>({
  loadRaw: async () => {
    const raw = await getGtmhData();
    if (!raw || !Array.isArray(raw)) return [];
    return (raw as RawWeaponEntry[]).filter((item) => item.type === "HW");
  },
  map: (raw) => mapWeapon(raw),
});

export const getAllWeapons = service.getAll;
export const clearWeaponCache = service.clearCache;

export function formatWeaponValue(valueCp: number): string {
  const gp = valueCp / 100;
  if (gp >= 1000) return `${gp.toLocaleString("en-US")} gp`;
  return `${gp} gp`;
}
