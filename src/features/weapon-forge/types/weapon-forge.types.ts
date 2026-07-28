import {
  Weapon,
  WeaponRarityRow,
  RARITY_ORDER,
  type WeaponModeDef,
} from "@/shared/types";
import { resolveWeaponModeDefs, createDefaultForgeModes } from "@/features/weapons/utils/weapon-mode.utils";

/** Rarity-table bonus column labels (replaces legacy single "Bonus"). */
export const BONUS_COLUMN_KEYS = {
  toHit: "Bonus to Hit",
  ac: "Bonus AC",
  damage: "Bonus to Damage",
} as const;

export type BonusColumnKey = keyof typeof BONUS_COLUMN_KEYS;

/** Preset resource columns (phials, coatings, etc.). */
export const RESOURCE_COLUMN_PRESETS = [
  "Phials",
  "Coatings",
  "Ammo",
  "Notes",
] as const;

const RESOURCE_COLUMN_HINTS = [
  "phials",
  "coatings",
  "ammo",
  "notes",
  "available",
] as const;

export function isResourceColumnLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return RESOURCE_COLUMN_HINTS.some((hint) => lower.includes(hint));
}

export function isPrimaryFeaturesColumn(label: string): boolean {
  const lower = label.toLowerCase();
  if (isResourceColumnLabel(label)) return false;
  return (
    lower === "features" ||
    lower.includes("single features") ||
    lower.includes("splint features")
  );
}

export function detectResourceColumns(rows: WeaponRarityRow[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.columns)) {
      if (isResourceColumnLabel(key)) seen.add(key);
    }
  }
  return [...seen];
}

export function detectPrimaryFeaturesLabel(rows: WeaponRarityRow[]): string {
  for (const row of rows) {
    for (const key of Object.keys(row.columns)) {
      if (isPrimaryFeaturesColumn(key)) return key;
    }
  }
  return "Features";
}

export interface WeaponForgeFeatureDef {
  id: string;
  name: string;
  /** Full rules text shown when the feature is expanded. */
  description: string;
  /** Feature this one upgrades, if any. */
  upgradesFromId?: string;
  /**
   * When set, this unlock is a weapon resource under that rarity-table column
   * (Phials, Coatings, Ammo, Notes, …) instead of Features.
   */
  resourceColumn?: string;
}

export interface CustomWeapon extends Weapon {
  /** Stable UUID for curated and user weapons. */
  id: string;
  createdAt: string;
  updatedAt: string;
  /** false = curated catalog (static JSON); true = user localStorage. */
  isCustom: boolean;
  /** Homebrew author (e.g. RaintDM, community variant author). */
  author?: string;
  /** Custom feature definitions with descriptions (RaintDM forge). */
  customFeatures?: WeaponForgeFeatureDef[];
}

/** Legacy bundled catalog shape (user exports). */
export interface RaintdmWeaponsCatalog {
  version: string;
  author?: string;
  description: string;
  weapons: unknown[];
}

export type WeaponForgeTab = "catalog" | "mine";

export interface WeaponForgeFormValues {
  name: string;
  author: string;
  dmg1: string;
  dmg2: string;
  /** Switch/stance modes (not Versatile). Empty when using Versatile (V) only. */
  modes: WeaponModeDef[];
  dmgType: string;
  properties: string[];
  weight: number;
  valueCp: number;
  acBonus: string;
  range: string;
  isFocus: boolean;
  description: string;
  supplementaryNotes: string;
  baseFeatureNames: string;
  rarityRows: WeaponRarityRow[];
  customFeatures: WeaponForgeFeatureDef[];
}

export function emptyRarityRows(): WeaponRarityRow[] {
  return RARITY_ORDER.map((rarity) => ({
    rarity,
    slots: rarity === "Common" ? 1 : RARITY_ORDER.indexOf(rarity) + 1,
    columns: {
      [BONUS_COLUMN_KEYS.toHit]: rarity === "Common" ? "--" : "",
      Features: [],
    },
  }));
}

export function emptyFormValues(): WeaponForgeFormValues {
  return {
    name: "",
    author: "RaintDM",
    dmg1: "1d8",
    dmg2: "",
    modes: [],
    dmgType: "S",
    properties: [],
    weight: 0,
    valueCp: 0,
    acBonus: "",
    range: "",
    isFocus: false,
    description: "",
    supplementaryNotes: "",
    baseFeatureNames: "",
    rarityRows: emptyRarityRows(),
    customFeatures: [],
  };
}

function newFeatureId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `feat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function columnNamesFromValue(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) {
    return val.map(String).filter((n) => n && n !== "--" && n !== "-");
  }
  if (typeof val === "string" && val.trim() && val !== "--") {
    return val
      .split(/,\s*/)
      .map((n) => n.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Build feature defs from rarity rows when importing weapons that lack
 * customFeatures. Also backfills `resourceColumn` when a name only appears
 * under a resource column (Phials, Coatings, …).
 */
export function featureDefsFromRarityRows(
  rows: WeaponRarityRow[],
  existing: WeaponForgeFeatureDef[] = [],
): WeaponForgeFeatureDef[] {
  const byName = new Map<string, WeaponForgeFeatureDef>(
    existing.map((f) => [f.name.toLowerCase(), { ...f }]),
  );

  /** nameLower → first resource column label seen (if any). */
  const resourceColumnByName = new Map<string, string>();
  const combatNames = new Set<string>();

  for (const row of rows) {
    for (const [label, val] of Object.entries(row.columns)) {
      const names = columnNamesFromValue(val);
      if (names.length === 0) continue;

      if (isResourceColumnLabel(label)) {
        for (const name of names) {
          const key = name.toLowerCase();
          if (!resourceColumnByName.has(key)) {
            resourceColumnByName.set(key, label);
          }
        }
        continue;
      }

      if (isPrimaryFeaturesColumn(label) || label.toLowerCase() === "features") {
        for (const name of names) {
          combatNames.add(name.toLowerCase());
        }
      }
    }
  }

  for (const row of rows) {
    for (const [label, val] of Object.entries(row.columns)) {
      if (
        !isPrimaryFeaturesColumn(label) &&
        label.toLowerCase() !== "features" &&
        !isResourceColumnLabel(label)
      ) {
        continue;
      }
      for (const name of columnNamesFromValue(val)) {
        const key = name.toLowerCase();
        const existingDef = byName.get(key);
        if (existingDef) {
          if (
            !existingDef.resourceColumn &&
            resourceColumnByName.has(key) &&
            !combatNames.has(key)
          ) {
            existingDef.resourceColumn = resourceColumnByName.get(key);
          }
          continue;
        }
        const resourceColumn =
          !combatNames.has(key) && resourceColumnByName.has(key)
            ? resourceColumnByName.get(key)
            : undefined;
        byName.set(key, {
          id: newFeatureId(),
          name,
          description: "",
          resourceColumn,
        });
      }
    }
  }

  return [...byName.values()];
}

export function weaponToFormValues(weapon: Weapon): WeaponForgeFormValues {
  const custom = weapon as CustomWeapon;
  const rows =
    weapon.rarityRows.length > 0
      ? weapon.rarityRows.map((row) => ({
          rarity: row.rarity,
          slots: row.slots,
          columns: { ...row.columns },
        }))
      : emptyRarityRows();

  const existingFeatures = Array.isArray(custom.customFeatures)
    ? custom.customFeatures.map((f) => ({ ...f }))
    : [];

  const customWeapon = custom as CustomWeapon;
  const resolvedModes = resolveWeaponModeDefs(weapon);
  const modes =
    resolvedModes ??
    (weapon.dmg2 && !weapon.properties.includes("V")
      ? createDefaultForgeModes(weapon.dmg1, weapon.dmg2)
      : []);

  return {
    name: weapon.name,
    author: customWeapon.author?.trim() || "RaintDM",
    dmg1: weapon.dmg1 || "1d8",
    dmg2: weapon.dmg2 ?? "",
    modes: modes.map((m) => ({ ...m })),
    dmgType: weapon.dmgType || "S",
    properties: [...weapon.properties],
    weight: weapon.weight,
    valueCp: weapon.valueCp,
    acBonus: weapon.acBonus != null ? String(weapon.acBonus) : "",
    range: weapon.range ?? "",
    isFocus: weapon.isFocus === true,
    description: weapon.description,
    supplementaryNotes: weapon.supplementaryNotes.join("\n\n"),
    baseFeatureNames: weapon.baseFeatureNames.join(", "),
    rarityRows: rows,
    customFeatures: featureDefsFromRarityRows(rows, existingFeatures),
  };
}

export function createFeatureDef(
  partial: Omit<WeaponForgeFeatureDef, "id"> & { id?: string },
): WeaponForgeFeatureDef {
  const resourceColumn = partial.resourceColumn?.trim() || undefined;
  return {
    id: partial.id ?? newFeatureId(),
    name: partial.name,
    description: partial.description,
    upgradesFromId: partial.upgradesFromId,
    resourceColumn,
  };
}
