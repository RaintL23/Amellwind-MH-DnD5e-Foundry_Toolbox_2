import { getBaseFeatureName } from "@/features/weapons/utils/weapon-feature-chains.utils";
import { isWeaponFeatureColumn, type WeaponRarityRow } from "@/shared/types";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";

const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getFeatureNamesFromRow(row: WeaponRarityRow): string[] {
  const names: string[] = [];
  for (const [label, val] of Object.entries(row.columns)) {
    if (!isWeaponFeatureColumn(label)) continue;
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
  // Prefer canonical "Features" key
  if ("features" in columns && columns.features !== columns.Features) {
    delete columns.features;
  }
  return { ...row, columns };
}

export function getBonusValue(row: WeaponRarityRow): string {
  const val = row.columns.Bonus ?? row.columns.bonus;
  if (val == null) return "";
  return Array.isArray(val) ? val.join(", ") : String(val);
}

export function setBonusValue(
  row: WeaponRarityRow,
  bonus: string,
): WeaponRarityRow {
  const columns = { ...row.columns };
  const trimmed = bonus.trim();
  if (!trimmed) {
    delete columns.Bonus;
    delete columns.bonus;
  } else {
    columns.Bonus = trimmed;
    delete columns.bonus;
  }
  return { ...row, columns };
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

export function collectPriorFeatureOptions(
  rows: WeaponRarityRow[],
  currentIndex: number,
  customFeatures: WeaponForgeFeatureDef[],
): Array<{ name: string; rarity: string; def?: WeaponForgeFeatureDef }> {
  const seen = new Set<string>();
  const options: Array<{
    name: string;
    rarity: string;
    def?: WeaponForgeFeatureDef;
  }> = [];

  for (let i = 0; i < currentIndex; i++) {
    const row = rows[i];
    for (const name of getFeaturesColumnNames(row)) {
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({
        name,
        rarity: row.rarity,
        def: findFeatureDef(customFeatures, name),
      });
    }
  }

  return options;
}

export function descriptionToParagraphs(description: string): string[] {
  return description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
