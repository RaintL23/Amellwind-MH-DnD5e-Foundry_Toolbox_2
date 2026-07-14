import type {
  CustomWeapon,
  RaintdmWeaponsCatalog,
} from "../types/weapon-forge.types";
import {
  parseImportedWeapons,
  weaponToRawExport,
} from "../mappers/weapon-forge.mapper";

const STORAGE_KEY = "weapon_forge_custom";
const CATALOG_URL = "/data/raintdm-weapons.json";

let curatedCache: CustomWeapon[] | null = null;

function readUserWeapons(): CustomWeapon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return parseImportedWeapons(parsed, { isCustom: true }).map((w) => ({
      ...w,
      isCustom: true,
    }));
  } catch {
    return [];
  }
}

function writeUserWeapons(weapons: CustomWeapon[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weapons));
  } catch {
    /* localStorage unavailable */
  }
}

export async function getCuratedWeapons(): Promise<CustomWeapon[]> {
  if (curatedCache) return curatedCache;

  try {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) {
      curatedCache = [];
      return curatedCache;
    }
    const data = (await response.json()) as RaintdmWeaponsCatalog | unknown;
    curatedCache = parseImportedWeapons(data, { isCustom: false }).map(
      (w) => ({
        ...w,
        isCustom: false,
        source: w.source || "RAINTDM",
      }),
    );
    return curatedCache;
  } catch {
    curatedCache = [];
    return curatedCache;
  }
}

export function clearCuratedWeaponCache(): void {
  curatedCache = null;
}

export function getUserWeapons(): CustomWeapon[] {
  return readUserWeapons();
}

export function saveUserWeapon(weapon: CustomWeapon): CustomWeapon[] {
  const list = readUserWeapons();
  const now = new Date().toISOString();
  const next: CustomWeapon = {
    ...weapon,
    isCustom: true,
    updatedAt: now,
    createdAt: weapon.createdAt || now,
  };

  const idx = list.findIndex((w) => w.id === next.id);
  if (idx >= 0) {
    list[idx] = next;
  } else {
    list.push(next);
  }

  writeUserWeapons(list);
  return list;
}

export function deleteUserWeapon(id: string): CustomWeapon[] {
  const list = readUserWeapons().filter((w) => w.id !== id);
  writeUserWeapons(list);
  return list;
}

export function importUserWeapons(data: unknown): CustomWeapon[] {
  const imported = parseImportedWeapons(data, { isCustom: true });
  const list = readUserWeapons();
  const byId = new Map(list.map((w) => [w.id, w]));

  for (const weapon of imported) {
    const now = new Date().toISOString();
    byId.set(weapon.id, {
      ...weapon,
      isCustom: true,
      updatedAt: now,
      createdAt: weapon.createdAt || now,
    });
  }

  const next = [...byId.values()];
  writeUserWeapons(next);
  return next;
}

export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportWeaponJson(weapon: CustomWeapon): void {
  const raw = weaponToRawExport(weapon);
  const safeName = weapon.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  downloadJson(raw, `${safeName || "weapon"}.json`);
}

export function exportAllUserWeaponsJson(weapons: CustomWeapon[]): void {
  downloadJson(
    {
      version: "1.0",
      author: "RaintDM",
      description: "MH Weapons — Amellwind Format by RaintDM (user export)",
      weapons: weapons.map((w) => weaponToRawExport(w)),
    },
    "raintdm-custom-weapons.json",
  );
}
