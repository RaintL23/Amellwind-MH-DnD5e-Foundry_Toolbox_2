import type { SiegeWeapon } from "@/shared/types";
import { getObjectsRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapSiegeWeapon } from "../mappers/siege-weapon.mapper";

const service = createEntityService<unknown, SiegeWeapon>({
  loadRaw: async () => {
    const rawData = (await getObjectsRaw()) as unknown[];
    return rawData.filter((raw) => {
      const entry = raw as Record<string, unknown>;
      return String(entry.objectType ?? "") === "SW";
    });
  },
  map: (raw) => mapSiegeWeapon(raw),
  idOf: (weapon) => weapon.id,
  nameOf: (weapon) => weapon.name.toLowerCase(),
});

export const getAllSiegeWeapons = service.getAll;
export const getSiegeWeaponById = service.getById;
export const clearSiegeWeaponCache = service.clearCache;
