import {
  WeaponRarityRow,
  isUnlockListColumn,
  isWeaponFeatureColumn,
} from "@/shared/types";

export interface FeatureAtRarity {
  name: string;
  rarityIndex: number;
}

export interface FeatureChain {
  baseName: string;
  features: FeatureAtRarity[];
  introducedAtIndex: number;
}

export interface ColumnChains {
  label: string;
  chains: FeatureChain[];
}

/** Strips " Upgrade [Roman/number]" suffixes to get the base feature name. */
export function getBaseFeatureName(name: string): string {
  return name.replace(/\s+Upgrade\b.*/i, "").trim();
}

function isUpgradeFeatureName(name: string): boolean {
  return /\bUpgrade\b/i.test(name);
}

/**
 * Match key so "Power Phial Upgrade" and "Power Phial (Costs 2)" resolve
 * to the same chain across Features vs Phials/Ammo/Coatings columns.
 */
export function normalizeFeatureMatchKey(name: string): string {
  return getBaseFeatureName(name)
    .replace(/\s*\(Costs\s+\d+\)\s*$/i, "")
    .trim()
    .toLowerCase();
}

/**
 * Moves upgrade-only chains onto a host chain in another column when names
 * match (e.g. Power Phial Upgrade under Power Phial in the Phials column).
 */
function reparentCrossColumnUpgrades(
  columnChains: ColumnChains[],
): ColumnChains[] {
  type HostRef = { colIndex: number; chain: FeatureChain };

  const hosts = new Map<string, HostRef>();
  for (let ci = 0; ci < columnChains.length; ci++) {
    for (const chain of columnChains[ci].chains) {
      const first = chain.features[0];
      if (!first || isUpgradeFeatureName(first.name)) continue;
      const key = normalizeFeatureMatchKey(chain.baseName);
      if (!hosts.has(key)) {
        hosts.set(key, { colIndex: ci, chain });
      }
    }
  }

  return columnChains.map((col, ci) => {
    const chains: FeatureChain[] = [];

    for (const chain of col.chains) {
      const first = chain.features[0];
      const key = normalizeFeatureMatchKey(chain.baseName);
      const host = hosts.get(key);

      if (
        host &&
        host.colIndex !== ci &&
        first &&
        isUpgradeFeatureName(first.name)
      ) {
        host.chain.features.push(...chain.features);
        host.chain.features.sort((a, b) => a.rarityIndex - b.rarityIndex);
        continue;
      }

      chains.push(chain);
    }

    return { ...col, chains };
  });
}

export function buildColumnChains(rarityRows: WeaponRarityRow[]): ColumnChains[] {
  const colLabelOrder: string[] = [];
  const colLabelSet = new Set<string>();

  for (const row of rarityRows) {
    for (const label of Object.keys(row.columns)) {
      if (isWeaponFeatureColumn(label) && !colLabelSet.has(label)) {
        colLabelOrder.push(label);
        colLabelSet.add(label);
      }
    }
  }

  const columnChains = colLabelOrder.map((colLabel) => {
    const chainMap = new Map<string, FeatureChain>();

    for (let i = 0; i < rarityRows.length; i++) {
      const val = rarityRows[i].columns[colLabel];
      if (!val) continue;

      const items = Array.isArray(val) ? val : [val];

      for (const name of items) {
        if (!name) continue;
        const baseName = getBaseFeatureName(name);

        if (!chainMap.has(baseName)) {
          chainMap.set(baseName, {
            baseName,
            features: [{ name, rarityIndex: i }],
            introducedAtIndex: i,
          });
        } else {
          chainMap.get(baseName)!.features.push({ name, rarityIndex: i });
        }
      }
    }

    const chains = Array.from(chainMap.values()).sort(
      (a, b) => a.introducedAtIndex - b.introducedAtIndex,
    );

    return { label: colLabel, chains };
  });

  return reparentCrossColumnUpgrades(columnChains);
}

export function getUnlockColumnLabels(rarityRows: WeaponRarityRow[]): string[] {
  const labels = new Set<string>();
  for (const row of rarityRows) {
    for (const label of Object.keys(row.columns)) {
      if (isUnlockListColumn(label)) labels.add(label);
    }
  }
  return [...labels].sort();
}

export function getAccumulatedUnlocks(
  rarityRows: WeaponRarityRow[],
  columnLabel: string,
  upToIndex: number,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i <= upToIndex; i++) {
    const val = rarityRows[i]?.columns[columnLabel];
    if (!val) continue;
    const items = Array.isArray(val) ? val : [val];
    for (const item of items) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
  }

  return result;
}
