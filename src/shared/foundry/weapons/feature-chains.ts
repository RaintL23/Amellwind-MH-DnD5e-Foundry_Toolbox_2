import {
  UNLOCK_COLUMN_PREFIX,
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

/** Optional explicit upgrade parent links (RaintDM forge customFeatures). */
export interface FeatureUpgradeLink {
  id: string;
  name: string;
  upgradesFromId?: string;
}

export interface BuildColumnChainsOptions {
  upgradeLinks?: FeatureUpgradeLink[];
}

/** Strips " Upgrade [Roman/number]" suffixes to get the base feature name. */
export function getBaseFeatureName(name: string): string {
  return name.replace(/\s+Upgrade\b.*/i, "").trim();
}

function isUpgradeFeatureName(name: string): boolean {
  return /\bUpgrade\b/i.test(name);
}

function buildUpgradeLinkIndexes(upgradeLinks: FeatureUpgradeLink[] | undefined): {
  byNameLower: Map<string, FeatureUpgradeLink>;
  byId: Map<string, FeatureUpgradeLink>;
} {
  const byNameLower = new Map<string, FeatureUpgradeLink>();
  const byId = new Map<string, FeatureUpgradeLink>();

  if (!upgradeLinks) return { byNameLower, byId };

  for (const link of upgradeLinks) {
    const trimmed = link.name.trim();
    if (!trimmed) continue;
    byId.set(link.id, link);
    // First name wins; upgraded roots overwrite below.
    if (!byNameLower.has(trimmed.toLowerCase())) {
      byNameLower.set(trimmed.toLowerCase(), link);
    }
  }

  const upgradedIds = new Set(
    upgradeLinks.map((l) => l.upgradesFromId).filter(Boolean),
  );
  for (const link of upgradeLinks) {
    if (!upgradedIds.has(link.id)) continue;
    const trimmed = link.name.trim();
    if (!trimmed) continue;
    byNameLower.set(trimmed.toLowerCase(), link);
  }

  return { byNameLower, byId };
}

/**
 * Resolves which chain a feature belongs to.
 * Prefers explicit upgradesFromId links; falls back to Amellwind name heuristics.
 */
export function resolveFeatureChainKey(
  name: string,
  indexes: {
    byNameLower: Map<string, FeatureUpgradeLink>;
    byId: Map<string, FeatureUpgradeLink>;
  },
  visiting: Set<string> = new Set(),
): string {
  const link =
    indexes.byId.get(name) ?? indexes.byNameLower.get(name.toLowerCase());
  if (link?.upgradesFromId && !visiting.has(link.id)) {
    const parent = indexes.byId.get(link.upgradesFromId);
    if (parent?.name.trim()) {
      visiting.add(link.id);
      const parentKey = resolveFeatureChainKey(
        parent.name,
        indexes,
        visiting,
      );
      visiting.delete(link.id);
      return parentKey;
    }
  }

  // If the rarity token is a feature id, use the display name for chain grouping.
  const self = indexes.byId.get(name);
  if (self?.name.trim()) {
    return getBaseFeatureName(self.name);
  }

  return getBaseFeatureName(name);
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

/** "Unlocked Ammo" → "Ammo" so trailing nested tables join the resource column. */
function unlockHostLabel(label: string): string {
  const host = label.slice(UNLOCK_COLUMN_PREFIX.length).trim();
  return host || label;
}

/**
 * Feature / resource columns that feed rarity-slide chains.
 *
 * Trailing "Unlocked …" lists become the display column for resource *types*
 * (Normal, Tranq, Power Phial, …). When the rarity table also has a feature
 * column with that same host name (Light Bowgun: Ammo column holds
 * `Ammo (LBG)` / Capacity Increase while types live in Unlocked Ammo), that
 * feature column is remapped to **Features** so rule optfeatures stay with
 * Features and Ammo/Coatings/… only list unlockable resources.
 */
function collectChainColumnSources(rarityRows: WeaponRarityRow[]): {
  displayLabel: string;
  sourceLabels: string[];
}[] {
  const order: string[] = [];
  const sourcesByDisplay = new Map<string, string[]>();
  const lowerToDisplay = new Map<string, string>();

  const featureLabels: string[] = [];
  const featureLabelSet = new Set<string>();
  const unlockLabels: string[] = [];
  const unlockLabelSet = new Set<string>();

  for (const row of rarityRows) {
    for (const label of Object.keys(row.columns)) {
      if (isWeaponFeatureColumn(label)) {
        if (!featureLabelSet.has(label)) {
          featureLabelSet.add(label);
          featureLabels.push(label);
        }
      } else if (isUnlockListColumn(label)) {
        if (!unlockLabelSet.has(label)) {
          unlockLabelSet.add(label);
          unlockLabels.push(label);
        }
      }
    }
  }

  const featureDisplayBySource = new Map<string, string>();
  for (const unlockLabel of unlockLabels) {
    const host = unlockHostLabel(unlockLabel);
    const hostKey = host.toLowerCase();
    for (const featureLabel of featureLabels) {
      if (featureLabel.toLowerCase() !== hostKey) continue;
      // Prefer an existing Features column casing when present.
      const existingFeatures = featureLabels.find(
        (l) => l.toLowerCase() === "features",
      );
      featureDisplayBySource.set(featureLabel, existingFeatures ?? "Features");
    }
  }

  const addSource = (displayLabel: string, sourceLabel: string) => {
    const key = displayLabel.toLowerCase();
    let canonical = lowerToDisplay.get(key);
    if (!canonical) {
      canonical = displayLabel;
      lowerToDisplay.set(key, canonical);
      order.push(canonical);
      sourcesByDisplay.set(canonical, []);
    }
    const sources = sourcesByDisplay.get(canonical)!;
    if (!sources.includes(sourceLabel)) sources.push(sourceLabel);
  };

  for (const label of featureLabels) {
    addSource(featureDisplayBySource.get(label) ?? label, label);
  }
  for (const unlockLabel of unlockLabels) {
    addSource(unlockHostLabel(unlockLabel), unlockLabel);
  }

  return order.map((displayLabel) => ({
    displayLabel,
    sourceLabels: sourcesByDisplay.get(displayLabel) ?? [displayLabel],
  }));
}

export function buildColumnChains(
  rarityRows: WeaponRarityRow[],
  options: BuildColumnChainsOptions = {},
): ColumnChains[] {
  const upgradeIndexes = buildUpgradeLinkIndexes(options.upgradeLinks);
  const hasExplicitLinks = upgradeIndexes.byId.size > 0;

  const columnSources = collectChainColumnSources(rarityRows);

  const columnChains = columnSources.map(({ displayLabel, sourceLabels }) => {
    const chainMap = new Map<string, FeatureChain>();

    for (let i = 0; i < rarityRows.length; i++) {
      for (const sourceLabel of sourceLabels) {
        const val = rarityRows[i].columns[sourceLabel];
        if (!val) continue;

        const items = Array.isArray(val) ? val : [val];

        for (const name of items) {
          if (!name) continue;
          const chainKey = hasExplicitLinks
            ? resolveFeatureChainKey(name, upgradeIndexes)
            : getBaseFeatureName(name);

          if (!chainMap.has(chainKey)) {
            chainMap.set(chainKey, {
              baseName: chainKey,
              features: [{ name, rarityIndex: i }],
              introducedAtIndex: i,
            });
          } else {
            const chain = chainMap.get(chainKey)!;
            chain.features.push({ name, rarityIndex: i });
            chain.introducedAtIndex = Math.min(chain.introducedAtIndex, i);
          }
        }
      }
    }

    for (const chain of chainMap.values()) {
      chain.features.sort((a, b) => a.rarityIndex - b.rarityIndex);
    }

    const chains = Array.from(chainMap.values()).sort(
      (a, b) => a.introducedAtIndex - b.introducedAtIndex,
    );

    return { label: displayLabel, chains };
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
