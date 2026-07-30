import { getBaseFeatureName } from "@/features/weapons/utils/weapon-feature-chains.utils";
import { type WeaponRarityRow } from "@/shared/types";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import {
  BONUS_COLUMN_KEYS,
  isPrimaryFeaturesColumn,
  isResourceColumnLabel,
  type BonusColumnKey,
} from "../types/weapon-forge.types";

export interface AssignedFeatureRef {
  /** Value stored in the rarity column (feature id when known, else display name). */
  token: string;
  /** Display name resolved from customFeatures when possible. */
  name: string;
  /** Stable feature id when the token resolves to a def. */
  id?: string;
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

/** Resolve a rarity-column token to a feature def (id first, then name). */
export function resolveFeatureDef(
  features: WeaponForgeFeatureDef[],
  tokenOrName: string,
): WeaponForgeFeatureDef | undefined {
  const trimmed = tokenOrName.trim();
  if (!trimmed) return undefined;
  const byId = findFeatureDefById(features, trimmed);
  if (byId) return byId;
  return findFeatureDef(features, trimmed);
}

/** Display label for a rarity-column token. */
export function featureDisplayName(
  features: WeaponForgeFeatureDef[],
  tokenOrName: string,
): string {
  return resolveFeatureDef(features, tokenOrName)?.name ?? tokenOrName;
}

/** Token stored in rarity columns — prefer stable id so duplicate names stay distinct. */
export function featureStorageToken(feature: WeaponForgeFeatureDef): string {
  return feature.id || feature.name;
}

function tokensMatchFeature(
  token: string,
  featureNameOrToken: string,
  featureId?: string,
): boolean {
  const key = token.toLowerCase();
  if (featureId && key === featureId.toLowerCase()) return true;
  return key === featureNameOrToken.toLowerCase();
}

/** Combat Features + resource-column unlocks assigned on a rarity row. */
export function getAssignedFeaturesForRow(
  row: WeaponRarityRow,
  features: WeaponForgeFeatureDef[] = [],
): AssignedFeatureRef[] {
  const result: AssignedFeatureRef[] = [];
  const seen = new Set<string>();

  const pushToken = (token: string, resourceColumn?: string) => {
    const key = token.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const def = resolveFeatureDef(features, token);
    result.push({
      token,
      name: def?.name ?? token,
      id: def?.id,
      resourceColumn: def?.resourceColumn ?? resourceColumn,
    });
  };

  for (const token of getFeaturesColumnNames(row)) {
    pushToken(token);
  }

  for (const label of Object.keys(row.columns)) {
    if (!isResourceColumnLabel(label)) continue;
    for (const token of getResourceColumnNames(row, label)) {
      pushToken(token, label);
    }
  }

  return result;
}

export function getAllAssignedFeatureNames(
  rows: WeaponRarityRow[],
  features: WeaponForgeFeatureDef[] = [],
): string[] {
  const names: string[] = [];
  for (const row of rows) {
    for (const ref of getAssignedFeaturesForRow(row, features)) {
      names.push(ref.name);
    }
  }
  return names;
}

function removeTokenFromColumn(
  row: WeaponRarityRow,
  columnLabel: string | undefined,
  featureNameOrToken: string,
  featureId?: string,
): WeaponRarityRow {
  const matches = (token: string) =>
    tokensMatchFeature(token, featureNameOrToken, featureId);

  if (!columnLabel) {
    return setFeaturesColumnNames(
      row,
      getFeaturesColumnNames(row).filter((n) => !matches(n)),
    );
  }
  return setResourceColumnNames(
    row,
    columnLabel,
    getResourceColumnNames(row, columnLabel).filter((n) => !matches(n)),
  );
}

function addTokenToColumn(
  row: WeaponRarityRow,
  columnLabel: string | undefined,
  token: string,
): WeaponRarityRow {
  const key = token.toLowerCase();
  if (!columnLabel) {
    const names = getFeaturesColumnNames(row);
    if (names.some((n) => n.toLowerCase() === key)) return row;
    return setFeaturesColumnNames(row, [...names, token]);
  }
  const names = getResourceColumnNames(row, columnLabel);
  if (names.some((n) => n.toLowerCase() === key)) return row;
  return setResourceColumnNames(row, columnLabel, [...names, token]);
}

/** Add a feature to the correct column for this rarity row (stores id when present). */
export function addFeatureNameToRow(
  row: WeaponRarityRow,
  featureName: string,
  resourceColumn?: string,
): WeaponRarityRow {
  return addTokenToColumn(row, resourceColumn || undefined, featureName);
}

/** Add a feature def to a rarity row, storing its id so duplicate names stay distinct. */
export function addFeatureToRow(
  row: WeaponRarityRow,
  feature: WeaponForgeFeatureDef,
  resourceColumn?: string,
): WeaponRarityRow {
  return addTokenToColumn(
    row,
    resourceColumn || feature.resourceColumn || undefined,
    featureStorageToken(feature),
  );
}

/** Remove a feature from Features and all resource columns on a row. */
export function removeFeatureNameFromRow(
  row: WeaponRarityRow,
  featureName: string,
  featureId?: string,
): WeaponRarityRow {
  let next = removeTokenFromColumn(row, undefined, featureName, featureId);
  for (const label of Object.keys(next.columns)) {
    if (!isResourceColumnLabel(label)) continue;
    next = removeTokenFromColumn(next, label, featureName, featureId);
  }
  return next;
}

/**
 * Rename a feature across Features and all resource columns.
 * Only rewrites legacy name tokens; id tokens stay stable when the label changes.
 */
export function renameFeatureInRow(
  row: WeaponRarityRow,
  previousName: string,
  nextName: string,
  featureId?: string,
): WeaponRarityRow {
  const prevKey = previousName.toLowerCase();
  const rewrite = (token: string) => {
    if (featureId && token === featureId) return token;
    return token.toLowerCase() === prevKey ? nextName : token;
  };
  let next = setFeaturesColumnNames(
    row,
    getFeaturesColumnNames(row).map(rewrite),
  );
  for (const label of Object.keys(next.columns)) {
    if (!isResourceColumnLabel(label)) continue;
    next = setResourceColumnNames(
      next,
      label,
      getResourceColumnNames(next, label).map(rewrite),
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
  featureId?: string,
): WeaponRarityRow[] {
  const prev = previousColumn || undefined;
  const next = nextColumn || undefined;
  if (prev === next) return rows;

  const matches = (token: string) =>
    tokensMatchFeature(token, featureName, featureId);
  const storageToken = featureId || featureName;

  return rows.map((row) => {
    const inPrev = prev
      ? getResourceColumnNames(row, prev).some(matches)
      : getFeaturesColumnNames(row).some(matches);
    if (!inPrev) return row;
    let updated = removeTokenFromColumn(row, prev, featureName, featureId);
    updated = addTokenToColumn(updated, next, storageToken);
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
  const matches = features.filter((f) => f.name.toLowerCase() === key);
  if (matches.length <= 1) return matches[0];

  // Prefer the variant that later upgrades point at (canonical progression root).
  const upgradedIds = new Set(
    features.map((f) => f.upgradesFromId).filter(Boolean),
  );
  return matches.find((f) => upgradedIds.has(f.id)) ?? matches[0];
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
    for (const ref of getAssignedFeaturesForRow(row, customFeatures)) {
      const def = resolveFeatureDef(customFeatures, ref.token);
      const id = def?.id ?? ref.token;
      if (seen.has(id)) continue;
      seen.add(id);
      options.push({
        id,
        name: def?.name ?? ref.name,
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
  const seen = new Set<string>();
  const result: WeaponForgeFeatureDef[] = [];

  // Resolve each row assignment to a single def. Do not re-scan all
  // customFeatures by display name — orphans / duplicate names would ghost in.
  for (let i = 0; i < options.beforeRarityIndex; i++) {
    const row = rows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, customFeatures)) {
      const def =
        (ref.id
          ? findFeatureDefById(customFeatures, ref.id)
          : undefined) ?? resolveFeatureDef(customFeatures, ref.token);
      if (!def) continue;
      if (def.id === options.excludeFeatureId) continue;
      if (seen.has(def.id)) continue;
      seen.add(def.id);
      result.push(def);
    }
  }

  return result;
}

export function findFeatureMinRarityIndex(
  rows: WeaponRarityRow[],
  featureName: string,
  featureId?: string,
): number {
  for (let i = 0; i < rows.length; i++) {
    if (
      getAssignedFeaturesForRow(rows[i]).some((ref) =>
        tokensMatchFeature(ref.token, featureName, featureId),
      )
    ) {
      return i;
    }
  }
  return rows.length;
}

/** Rewrite rarity-column feature tokens to display names (for JSON export). */
export function rarityRowsWithFeatureDisplayNames(
  rows: WeaponRarityRow[],
  features: WeaponForgeFeatureDef[],
): WeaponRarityRow[] {
  if (features.length === 0) return rows;

  return rows.map((row) => {
    const columns: WeaponRarityRow["columns"] = {};
    for (const [label, val] of Object.entries(row.columns)) {
      const isFeatureCol =
        isPrimaryFeaturesColumn(label) ||
        label.toLowerCase() === "features" ||
        isResourceColumnLabel(label);

      if (!isFeatureCol) {
        columns[label] = val;
        continue;
      }

      const tokens = Array.isArray(val)
        ? val.map(String)
        : val
          ? [String(val)]
          : [];
      const names = tokens
        .map((t) => t.trim())
        .filter((t) => t && t !== "--" && t !== "-")
        .map((t) => featureDisplayName(features, t));
      columns[label] = Array.isArray(val) ? names : (names[0] ?? val);
    }
    return { ...row, columns };
  });
}

export function descriptionToParagraphs(description: string): string[] {
  return description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
