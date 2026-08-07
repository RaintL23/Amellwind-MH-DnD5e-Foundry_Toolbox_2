import type {
  CustomWeapon,
  RaintdmWeaponsCatalog,
} from "../types/weapon-forge.types";
import {
  parseImportedWeapons,
  weaponToRawExport,
} from "../mappers/weapon-forge.mapper";
import {
  buildWeaponFoundryExportBundle,
  foundryItemFilename,
} from "../mappers/weapon-forge-foundry.export";
import { melodyFeatFilename } from "../mappers/weapon-forge-melody.export";
import type { FoundryItem } from "@/shared/foundry";
import { downloadFoundryJson } from "@/shared/foundry";

const STORAGE_KEY = "weapon_forge_custom";
const MANIFEST_URL = "/data/raintdm-weapons/manifest.json";
const WEAPONS_BASE = "/data/raintdm-weapons";

interface RaintdmManifest {
  version?: string;
  description?: string;
  weapons: string[];
}

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

async function loadCuratedFromManifest(): Promise<CustomWeapon[]> {
  const manifestRes = await fetch(MANIFEST_URL);
  if (!manifestRes.ok) {
    throw new Error(`Manifest not found (${manifestRes.status})`);
  }

  const manifest = (await manifestRes.json()) as RaintdmManifest;
  const files = Array.isArray(manifest.weapons) ? manifest.weapons : [];
  if (files.length === 0) return [];

  const payloads = await Promise.all(
    files.map(async (file) => {
      // Basename only: reject path segments, traversal, and non-JSON names.
      const safeName = file.replace(/\\/g, "/").split("/").pop() ?? "";
      if (!safeName || safeName === "." || safeName === ".." || !/\.json$/i.test(safeName)) {
        console.warn(`Skipped unsafe curated weapon path: ${file}`);
        return null;
      }
      const res = await fetch(`${WEAPONS_BASE}/${encodeURIComponent(safeName)}`);
      if (!res.ok) {
        console.warn(`Failed to load curated weapon: ${safeName}`);
        return null;
      }
      return (await res.json()) as unknown;
    }),
  );

  return parseImportedWeapons(payloads.filter((p) => p != null), {
    isCustom: false,
  }).map((w) => ({
    ...w,
    isCustom: false,
    source: w.source || "RAINTDM",
  }));
}

export async function getCuratedWeapons(): Promise<CustomWeapon[]> {
  if (curatedCache) return curatedCache;

  try {
    curatedCache = await loadCuratedFromManifest();
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

/** Curated raintdm catalog plus user weapons from localStorage. */
export async function getAllForgeWeapons(): Promise<CustomWeapon[]> {
  const curated = await getCuratedWeapons();
  return [...curated, ...getUserWeapons()];
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
  downloadFoundryJson(data, filename);
}

export function exportWeaponJson(weapon: CustomWeapon): void {
  const raw = weaponToRawExport(weapon);
  const safeName = weapon.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  downloadJson(raw, `${safeName || "weapon"}.json`);
}

export function exportWeaponFoundryJson(
  weapon: CustomWeapon,
  rarityIndex: number,
  /** When provided, downloads this exact weapon payload (must match preview). */
  item?: FoundryItem,
  options?: { includeResources?: boolean },
): void {
  const includeResources = options?.includeResources === true;
  const bundle = item
    ? {
        weapon: item,
        resources: includeResources
          ? buildWeaponFoundryExportBundle(weapon, rarityIndex).resources
          : [],
      }
    : (() => {
        const full = buildWeaponFoundryExportBundle(weapon, rarityIndex);
        return {
          weapon: full.weapon,
          resources: includeResources ? full.resources : [],
        };
      })();

  const files: Array<{ data: unknown; filename: string }> = [
    {
      data: bundle.weapon,
      filename: foundryItemFilename(weapon, rarityIndex),
    },
  ];
  for (const resource of bundle.resources) {
    files.push({
      data: resource,
      filename: melodyFeatFilename(resource),
    });
  }

  // Browsers often keep only the last of several immediate downloads.
  files.forEach((file, index) => {
    window.setTimeout(() => downloadJson(file.data, file.filename), index * 150);
  });
}

export function exportAllUserWeaponsJson(weapons: CustomWeapon[]): void {
  downloadJson(
    {
      version: "1.0",
      description: "MH Weapons — user export (drop each weapon JSON into public/data/raintdm-weapons/)",
      weapons: weapons.map((w) => weaponToRawExport(w)),
    } satisfies RaintdmWeaponsCatalog,
    "raintdm-custom-weapons.json",
  );
}
