import { Weapon, WeaponRarityRow, RARITY_ORDER } from "@/shared/types";

export interface WeaponForgeFeatureDef {
  id: string;
  name: string;
  /** Full rules text shown when the feature is expanded. */
  description: string;
  /** Feature this one upgrades, if any. */
  upgradesFromId?: string;
}

export interface CustomWeapon extends Weapon {
  /** Stable UUID for curated and user weapons. */
  id: string;
  createdAt: string;
  updatedAt: string;
  /** false = curated catalog (static JSON); true = user localStorage. */
  isCustom: boolean;
  /** Custom feature definitions with descriptions (RaintDM forge). */
  customFeatures?: WeaponForgeFeatureDef[];
}

/** Shape of the static curated catalog file. */
export interface RaintdmWeaponsCatalog {
  version: string;
  author: string;
  description: string;
  weapons: unknown[];
}

export type WeaponForgeTab = "catalog" | "mine";

export interface WeaponForgeFormValues {
  name: string;
  dmg1: string;
  dmg2: string;
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
    columns: { Bonus: rarity === "Common" ? "--" : "", Features: [] },
  }));
}

export function emptyFormValues(): WeaponForgeFormValues {
  return {
    name: "",
    dmg1: "1d8",
    dmg2: "",
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

/** Build feature defs from rarity rows when importing weapons that lack customFeatures. */
export function featureDefsFromRarityRows(
  rows: WeaponRarityRow[],
  existing: WeaponForgeFeatureDef[] = [],
): WeaponForgeFeatureDef[] {
  const byName = new Map(
    existing.map((f) => [f.name.toLowerCase(), f] as const),
  );

  for (const row of rows) {
    const featuresVal = row.columns.Features ?? row.columns.features;
    const names = Array.isArray(featuresVal)
      ? featuresVal
      : typeof featuresVal === "string" && featuresVal.trim()
        ? [featuresVal]
        : [];

    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed || trimmed === "--" || trimmed === "-") continue;
      const key = trimmed.toLowerCase();
      if (byName.has(key)) continue;
      byName.set(key, {
        id: newFeatureId(),
        name: trimmed,
        description: "",
      });
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

  return {
    name: weapon.name,
    dmg1: weapon.dmg1 || "1d8",
    dmg2: weapon.dmg2 ?? "",
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
  return {
    id: partial.id ?? newFeatureId(),
    name: partial.name,
    description: partial.description,
    upgradesFromId: partial.upgradesFromId,
  };
}
