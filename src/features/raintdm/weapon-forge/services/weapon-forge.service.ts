/**
 * Weapon Forge catalog: curated JSON under `public/data/raintdm-weapons/` plus
 * user weapons in localStorage. Curated list is cached in memory; user list is
 * read/written on each mutation.
 */
import type {
  CustomWeapon,
  RaintdmWeaponsCatalog,
} from "../types/weapon-forge.types";
import {
  parseImportedWeapons,
  weaponToRawExport,
} from "../mappers/weapon-forge.mapper";
import { downloadFoundryJson } from "@/shared/foundry";
import {
  buildWeaponFoundryExportBundle,
  foundryItemFilename,
} from "../mappers/weapon-forge-foundry.export";
import { melodyFeatFilename } from "../mappers/weapon-forge-melody.export";
import { phialFeatFilename } from "../mappers/weapon-forge-phial.export";
import { magazineConsumableFilename } from "../mappers/weapon-forge-magazine.export";

const STORAGE_KEY = "weapon_forge_custom";
const MANIFEST_URL = "/data/raintdm-weapons/manifest.json";
const WEAPONS_BASE = "/data/raintdm-weapons";

interface RaintdmManifest {
  version?: string;
  description?: string;
  weapons: string[];
}

let curatedCache: CustomWeapon[] | null = null;

// ─── User weapons (localStorage) ──────────────────────────────────────────────

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

// ─── Curated catalog (manifest fetch) ─────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

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

const FOUNDRY_DOWNLOAD_STAGGER_MS = 150;

/** Foundry Item for one rarity, plus resource feats/consumables when the bundle emits them. */
export function exportWeaponFoundryJson(
  weapon: CustomWeapon,
  rarityIndex: number,
): void {
  const bundle = buildWeaponFoundryExportBundle(weapon, rarityIndex);
  downloadFoundryJson(bundle.weapon, foundryItemFilename(weapon, rarityIndex));

  let delayIndex = 0;
  for (const group of bundle.resourceGroups) {
    const filenameFor =
      group.id === "magazines"
        ? magazineConsumableFilename
        : group.id === "phials"
          ? phialFeatFilename
          : melodyFeatFilename;
    for (const item of group.items) {
      delayIndex += 1;
      const filename = filenameFor(item);
      setTimeout(
        () => downloadFoundryJson(item, filename),
        delayIndex * FOUNDRY_DOWNLOAD_STAGGER_MS,
      );
    }
  }
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
