import {
  BASE_RARITY,
  WEAPON_RARITY_ORDER,
  isBaseRarity,
  type OptionalFeature,
  type Weapon,
  type WeaponRarityRow,
} from "@/shared/types";

function featureNamesFromRow(row: WeaponRarityRow): string[] {
  const val = row.columns.Features ?? row.columns.features;
  if (Array.isArray(val)) {
    return val.map(String).filter((n) => n && n !== "--" && n !== "-");
  }
  if (typeof val === "string" && val.trim() && val !== "--") {
    return [val.trim()];
  }
  return [];
}

export function findBaseRarityIndex(rows: WeaponRarityRow[]): number {
  return rows.findIndex((row) => isBaseRarity(row.rarity));
}

export function createEmptyBaseRarityRow(
  featureNames: string[] = [],
): WeaponRarityRow {
  return {
    rarity: BASE_RARITY,
    slots: 0,
    columns: {
      Features: [...featureNames],
    },
  };
}

/**
 * Ensure a Base rarity row exists (first). Does not invent feature names.
 * Used by the forge form so base features are always editable on a tier.
 */
export function ensureFormBaseRarityRow(
  rows: WeaponRarityRow[],
): WeaponRarityRow[] {
  const idx = findBaseRarityIndex(rows);
  if (idx === 0) return rows;
  if (idx > 0) {
    const next = [...rows];
    const [base] = next.splice(idx, 1);
    return [base, ...next];
  }
  return [createEmptyBaseRarityRow(), ...rows];
}

/**
 * For weapon dialogs: if there is no Base row yet, prepend one from resolved
 * base features. When a Base row already exists, leave it alone (forge edits win).
 */
export function ensureDisplayBaseRarityRows(
  rows: WeaponRarityRow[],
  baseFeatures: OptionalFeature[],
): WeaponRarityRow[] {
  if (findBaseRarityIndex(rows) >= 0) {
    return ensureFormBaseRarityRow(rows);
  }
  if (baseFeatures.length === 0) return rows;
  return [
    createEmptyBaseRarityRow(baseFeatures.map((f) => f.name)),
    ...rows,
  ];
}

export function weaponWithDisplayRarityRows(
  weapon: Weapon,
  baseFeatures: OptionalFeature[],
): Weapon {
  const rarityRows = ensureDisplayBaseRarityRows(
    weapon.rarityRows,
    baseFeatures,
  );
  if (rarityRows === weapon.rarityRows) return weapon;
  return { ...weapon, rarityRows };
}

/** Feature names listed on the Base rarity row. */
export function getBaseRarityFeatureNames(rows: WeaponRarityRow[]): string[] {
  const idx = findBaseRarityIndex(rows);
  if (idx < 0) return [];
  return featureNamesFromRow(rows[idx]);
}

/**
 * Put resolved base features onto the Base row and keep that row first.
 * Merges names without removing existing Base features.
 */
export function populateBaseRarityFeatures(
  rows: WeaponRarityRow[],
  featureNames: string[],
): WeaponRarityRow[] {
  const withBase = ensureFormBaseRarityRow(rows);
  const idx = findBaseRarityIndex(withBase);
  if (idx < 0) return withBase;

  const row = withBase[idx];
  const existing = featureNamesFromRow(row);
  const seen = new Set(existing.map((n) => n.toLowerCase()));
  const merged = [...existing];
  for (const name of featureNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(trimmed);
  }

  const next = [...withBase];
  next[idx] = {
    ...row,
    rarity: BASE_RARITY,
    slots: 0,
    columns: {
      ...row.columns,
      Features: merged,
    },
  };
  return next;
}

/** Sort rarity rows: Base first, then WEAPON_RARITY_ORDER, then unknowns. */
export function sortWeaponRarityRows(rows: WeaponRarityRow[]): WeaponRarityRow[] {
  const order = new Map(
    WEAPON_RARITY_ORDER.map((rarity, index) => [rarity, index]),
  );
  return [...rows].sort((a, b) => {
    const ai = order.get(a.rarity as (typeof WEAPON_RARITY_ORDER)[number]);
    const bi = order.get(b.rarity as (typeof WEAPON_RARITY_ORDER)[number]);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    return a.rarity.localeCompare(b.rarity);
  });
}
