import { getBaseFeatureName } from "@/features/weapons/utils/weapon-feature-chains.utils";
import { type WeaponRarityRow } from "@/shared/types";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import {
  BONUS_COLUMN_KEYS,
  type BonusColumnKey,
} from "../types/weapon-forge.types";

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
    for (const name of getFeaturesColumnNames(row)) {
      const def = findFeatureDef(customFeatures, name);
      const id = def?.id ?? name;
      if (seen.has(id)) continue;
      seen.add(id);
      options.push({
        id,
        name,
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
    for (const name of getFeaturesColumnNames(row)) {
      assignedNames.add(name.toLowerCase());
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
      getFeaturesColumnNames(rows[i]).some(
        (name) => name.toLowerCase() === key,
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
