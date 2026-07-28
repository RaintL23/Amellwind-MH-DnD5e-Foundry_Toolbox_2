import { getBaseFeatureName } from "@/features/weapons/utils/weapon-feature-chains.utils";
import { type WeaponRarityRow } from "@/shared/types";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import {
  BONUS_COLUMN_KEYS,
  isResourceColumnLabel,
  type BonusColumnKey,
} from "../types/weapon-forge.types";

export interface AssignedFeatureRef {
  name: string;
  /** Undefined = Features (combat) column. */
  resourceColumn?: string;
}

const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getFeatureNamesFromRow(row: WeaponRarityRow): string[] {
  const names: string[] = [];
  for (const [label, val] of Object.entries(row.columns)) {
    const lower = label.toLowerCase();
    if (lower.includes("bonus")) continue;
    const items = Array.isArray(val) ? val : val ? [val] : [];
    for (const item of items) {
      const name = String(item).trim();
      if (name && name !== "--" && name !== "-") names.push(name);
    }
  }
  return names;
}

export function getFeaturesColumnNames(row: WeaponRarityRow): string[] {
  const val = row.columns.Features ?? row.columns.features;
  if (Array.isArray(val)) {
    return val.map(String).filter((n) => n && n !== "--" && n !== "-");
  }
  if (typeof val === "string" && val.trim() && val !== "--") {
    return [val.trim()];
  }
  return [];
}

export function setFeaturesColumnNames(
  row: WeaponRarityRow,
  names: string[],
): WeaponRarityRow {
  const columns = { ...row.columns };
  if (names.length === 0) {
    columns.Features = [];
  } else {
    columns.Features = names;
  }
  if ("features" in columns && columns.features !== columns.Features) {
    delete columns.features;
  }
  return { ...row, columns };
}

export function getResourceColumnNames(
  row: WeaponRarityRow,
  columnLabel: string,
): string[] {
  const val = row.columns[columnLabel];
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

export function setResourceColumnNames(
  row: WeaponRarityRow,
  columnLabel: string,
  names: string[],
): WeaponRarityRow {
  const columns = { ...row.columns };
  if (names.length === 0) {
    delete columns[columnLabel];
  } else {
    columns[columnLabel] = names;
  }
  return { ...row, columns };
}

/** Combat Features + resource-column unlocks assigned on a rarity row. */
export function getAssignedFeaturesForRow(
  row: WeaponRarityRow,
): AssignedFeatureRef[] {
  const result: AssignedFeatureRef[] = [];
  const seen = new Set<string>();

  for (const name of getFeaturesColumnNames(row)) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ name });
  }

  for (const label of Object.keys(row.columns)) {
    if (!isResourceColumnLabel(label)) continue;
    for (const name of getResourceColumnNames(row, label)) {
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ name, resourceColumn: label });
    }
  }

  return result;
}

export function getAllAssignedFeatureNames(rows: WeaponRarityRow[]): string[] {
  const names: string[] = [];
  for (const row of rows) {
    for (const ref of getAssignedFeaturesForRow(row)) {
      names.push(ref.name);
    }
  }
  return names;
}

function removeNameFromColumn(
  row: WeaponRarityRow,
  columnLabel: string | undefined,
  featureName: string,
): WeaponRarityRow {
  const key = featureName.toLowerCase();
  if (!columnLabel) {
    return setFeaturesColumnNames(
      row,
      getFeaturesColumnNames(row).filter((n) => n.toLowerCase() !== key),
    );
  }
  return setResourceColumnNames(
    row,
    columnLabel,
    getResourceColumnNames(row, columnLabel).filter(
      (n) => n.toLowerCase() !== key,
    ),
  );
}

function addNameToColumn(
  row: WeaponRarityRow,
  columnLabel: string | undefined,
  featureName: string,
): WeaponRarityRow {
  const key = featureName.toLowerCase();
  if (!columnLabel) {
    const names = getFeaturesColumnNames(row);
    if (names.some((n) => n.toLowerCase() === key)) return row;
    return setFeaturesColumnNames(row, [...names, featureName]);
  }
  const names = getResourceColumnNames(row, columnLabel);
  if (names.some((n) => n.toLowerCase() === key)) return row;
  return setResourceColumnNames(row, columnLabel, [...names, featureName]);
}

/** Add a feature name to the correct column for this rarity row. */
export function addFeatureNameToRow(
  row: WeaponRarityRow,
  featureName: string,
  resourceColumn?: string,
): WeaponRarityRow {
  return addNameToColumn(row, resourceColumn || undefined, featureName);
}

/** Remove a feature name from Features and all resource columns on a row. */
export function removeFeatureNameFromRow(
  row: WeaponRarityRow,
  featureName: string,
): WeaponRarityRow {
  let next = removeNameFromColumn(row, undefined, featureName);
  for (const label of Object.keys(next.columns)) {
    if (!isResourceColumnLabel(label)) continue;
    next = removeNameFromColumn(next, label, featureName);
  }
  return next;
}

/** Rename a feature across Features and all resource columns. */
export function renameFeatureInRow(
  row: WeaponRarityRow,
  previousName: string,
  nextName: string,
): WeaponRarityRow {
  const prevKey = previousName.toLowerCase();
  let next = setFeaturesColumnNames(
    row,
    getFeaturesColumnNames(row).map((n) =>
      n.toLowerCase() === prevKey ? nextName : n,
    ),
  );
  for (const label of Object.keys(next.columns)) {
    if (!isResourceColumnLabel(label)) continue;
    next = setResourceColumnNames(
      next,
      label,
      getResourceColumnNames(next, label).map((n) =>
        n.toLowerCase() === prevKey ? nextName : n,
      ),
    );
  }
  return next;
}

/**
 * Move a feature between Features and a resource column (or between resource
 * columns) on every rarity row where it appears.
 */
export function reassignFeatureColumnInRows(
  rows: WeaponRarityRow[],
  featureName: string,
  previousColumn: string | undefined,
  nextColumn: string | undefined,
): WeaponRarityRow[] {
  const prev = previousColumn || undefined;
  const next = nextColumn || undefined;
  if (prev === next) return rows;

  const key = featureName.toLowerCase();
  return rows.map((row) => {
    const inPrev = prev
      ? getResourceColumnNames(row, prev).some((n) => n.toLowerCase() === key)
      : getFeaturesColumnNames(row).some((n) => n.toLowerCase() === key);
    if (!inPrev) return row;
    let updated = removeNameFromColumn(row, prev, featureName);
    updated = addNameToColumn(updated, next, featureName);
    return updated;
  });
}

function readBonusCell(row: WeaponRarityRow, label: string): string {
  const val = row.columns[label];
  if (val == null) return "";
  return Array.isArray(val) ? val.join(", ") : String(val);
}

/** Read a typed bonus value, falling back to legacy "Bonus" for to-hit only. */
export function getTypedBonusValue(
  row: WeaponRarityRow,
  key: BonusColumnKey,
): string {
  const label = BONUS_COLUMN_KEYS[key];
  const direct = readBonusCell(row, label);
  if (direct) return direct;

  if (key === "toHit") {
    const legacy = readBonusCell(row, "Bonus") || readBonusCell(row, "bonus");
    return legacy;
  }

  return "";
}

export function setTypedBonusValue(
  row: WeaponRarityRow,
  key: BonusColumnKey,
  value: string,
): WeaponRarityRow {
  const columns = { ...row.columns };
  const label = BONUS_COLUMN_KEYS[key];
  const trimmed = value.trim();

  if (!trimmed) {
    delete columns[label];
  } else {
    columns[label] = trimmed;
  }

  if (key === "toHit") {
    delete columns.Bonus;
    delete columns.bonus;
  }

  return { ...row, columns };
}

/** @deprecated Use getTypedBonusValue(row, "toHit") */
export function getBonusValue(row: WeaponRarityRow): string {
  return getTypedBonusValue(row, "toHit");
}

/** @deprecated Use setTypedBonusValue(row, "toHit", bonus) */
export function setBonusValue(
  row: WeaponRarityRow,
  bonus: string,
): WeaponRarityRow {
  return setTypedBonusValue(row, "toHit", bonus);
}

/** Suggest next Amellwind-style upgrade name (e.g. Charged Slash Upgrade I). */
export function suggestUpgradeName(
  sourceName: string,
  allFeatureNames: string[],
): string {
  const root = getBaseFeatureName(sourceName);
  const pattern = new RegExp(
    `^${escapeRegex(root)}\\s+Upgrade\\s+(.+)$`,
    "i",
  );

  let max = 0;
  for (const name of allFeatureNames) {
    const m = name.match(pattern);
    if (!m) continue;
    const romanIdx = ROMANS.findIndex(
      (r) => r.toLowerCase() === m[1].toLowerCase(),
    );
    if (romanIdx >= 0) {
      max = Math.max(max, romanIdx + 1);
      continue;
    }
    const asNum = Number.parseInt(m[1], 10);
    if (Number.isFinite(asNum)) max = Math.max(max, asNum);
  }

  const next = max + 1;
  return `${root} Upgrade ${ROMANS[next - 1] ?? String(next)}`;
}

export function findFeatureDef(
  features: WeaponForgeFeatureDef[],
  name: string,
): WeaponForgeFeatureDef | undefined {
  const key = name.toLowerCase();
  return features.find((f) => f.name.toLowerCase() === key);
}

export function findFeatureDefById(
  features: WeaponForgeFeatureDef[],
  id: string,
): WeaponForgeFeatureDef | undefined {
  return features.find((f) => f.id === id);
}

export function collectPriorFeatureOptions(
  rows: WeaponRarityRow[],
  currentIndex: number,
  customFeatures: WeaponForgeFeatureDef[],
): Array<{ id: string; name: string; rarity: string }> {
  const seen = new Set<string>();
  const options: Array<{ id: string; name: string; rarity: string }> = [];

  for (let i = 0; i < currentIndex; i++) {
    const row = rows[i];
    for (const ref of getAssignedFeaturesForRow(row)) {
      const def = findFeatureDef(customFeatures, ref.name);
      const id = def?.id ?? ref.name;
      if (seen.has(id)) continue;
      seen.add(id);
      options.push({
        id,
        name: ref.name,
        rarity: row.rarity,
      });
    }
  }

  return options;
}

/** Feature defs already assigned on the weapon before a given rarity index. */
export function collectAssignedUpgradeCandidates(
  rows: WeaponRarityRow[],
  customFeatures: WeaponForgeFeatureDef[],
  options: {
    beforeRarityIndex: number;
    excludeFeatureId?: string;
  },
): WeaponForgeFeatureDef[] {
  const assignedNames = new Set<string>();

  for (let i = 0; i < options.beforeRarityIndex; i++) {
    const row = rows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row)) {
      assignedNames.add(ref.name.toLowerCase());
    }
  }

  const seen = new Set<string>();
  const result: WeaponForgeFeatureDef[] = [];

  for (const key of assignedNames) {
    const def = customFeatures.find((f) => f.name.toLowerCase() === key);
    if (!def) continue;
    if (def.id === options.excludeFeatureId) continue;
    if (seen.has(def.id)) continue;
    seen.add(def.id);
    result.push(def);
  }

  return result;
}

export function findFeatureMinRarityIndex(
  rows: WeaponRarityRow[],
  featureName: string,
): number {
  const key = featureName.toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    if (
      getAssignedFeaturesForRow(rows[i]).some(
        (ref) => ref.name.toLowerCase() === key,
      )
    ) {
      return i;
    }
  }
  return rows.length;
}

export function descriptionToParagraphs(description: string): string[] {
  return description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
