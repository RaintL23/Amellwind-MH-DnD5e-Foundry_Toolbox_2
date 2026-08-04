import type { Weapon } from "@/shared/types";
import {
  buildColumnChains,
  type FeatureAtRarity,
  type FeatureChain,
  type FeatureUpgradeLink,
} from "./feature-chains";
import { isPrimaryFeaturesColumn } from "./feature-columns";
import type {
  WeaponFeatureDef,
  WeaponActivityCompileSource,
} from "./weapon-source.types";
import type {
  WeaponFeatureAutomationSpec,
  WeaponFeatureAutomationStatus,
} from "./activity.types";
import { mergeAutomationSpecs } from "./activity-merge";
import { lookupWeaponFeatureAutomation } from "./feature-automation.data";

export interface CombatFeatureChainLink {
  featureName: string;
  rarityIndex: number;
  def?: WeaponFeatureDef;
  automation?: WeaponFeatureAutomationSpec;
}

export interface CombatFeatureChain {
  /** Stable chain key (root id or baseName). */
  chainKey: string;
  baseName: string;
  introducedAtIndex: number;
  links: CombatFeatureChainLink[];
}

export interface ResolvedCombatChain {
  chain: CombatFeatureChain;
  /** Links unlocked at or before rarityIndex (root → leaf). */
  prefix: CombatFeatureChainLink[];
  leaf: CombatFeatureChainLink;
  /** Merged automation for emit. */
  effective: WeaponFeatureAutomationSpec | undefined;
  status: WeaponFeatureAutomationStatus;
  displayName: string;
}

function resolveFeatureDef(
  features: WeaponFeatureDef[],
  name: string,
): WeaponFeatureDef | undefined {
  const lower = name.toLowerCase();
  return (
    features.find((f) => f.name.toLowerCase() === lower) ??
    features.find((f) => f.id === name)
  );
}

function automationForLink(
  def: WeaponFeatureDef | undefined,
  featureName: string,
): WeaponFeatureAutomationSpec | undefined {
  if (def?.resourceColumn) return undefined;
  const fromRegistry = lookupWeaponFeatureAutomation(featureName);
  const saved = def?.automation;
  if (!saved) return fromRegistry;
  if (saved.enabled === false) return saved;

  // Legacy forge copies mapped counter features as resource_gauge only.
  // Prefer the registry when it now emits counter_spend / charge_pool_attack.
  if (
    saved.template === "resource_gauge" &&
    fromRegistry &&
    (fromRegistry.template === "counter_spend" ||
      fromRegistry.template === "charge_pool_attack") &&
    fromRegistry.enabled !== false
  ) {
    return {
      ...fromRegistry,
      params: { ...fromRegistry.params },
      chainKey: saved.chainKey ?? fromRegistry.chainKey,
      notes: saved.notes?.trim() ? saved.notes : fromRegistry.notes,
    };
  }

  return saved;
}

function statusForEffective(
  effective: WeaponFeatureAutomationSpec | undefined,
): WeaponFeatureAutomationStatus {
  if (
    !effective ||
    effective.enabled === false ||
    effective.template === "unmapped"
  ) {
    return "unmapped";
  }
  if (effective.template === "upgrade_scaler") return "partial";
  const params = effective.params ?? {};
  const hasSubstance =
    Object.keys(params).length > 0 ||
    !!effective.foundryOverrides ||
    effective.template === "mode_switch" ||
    effective.template === "mastery" ||
    effective.template === "counter_spend" ||
    effective.template === "charge_pool_attack";
  return hasSubstance ? "ready" : "partial";
}

/**
 * Build combat-only feature chains (Features / Single Features / Splint Features).
 * Resource columns (Phials, Coatings, …) are excluded.
 */
export function buildCombatFeatureChains(
  weapon: WeaponActivityCompileSource,
): CombatFeatureChain[] {
  const features = weapon.customFeatures ?? [];
  const upgradeLinks: FeatureUpgradeLink[] = features.map((f) => ({
    id: f.id,
    name: f.name,
    upgradesFromId: f.upgradesFromId,
  }));

  const columnChains = buildColumnChains(weapon.rarityRows, {
    upgradeLinks: upgradeLinks.length > 0 ? upgradeLinks : undefined,
  }).filter(({ label }) => isPrimaryFeaturesColumn(label));

  const byKey = new Map<string, CombatFeatureChain>();
  const resourceIds = new Set(
    features.filter((f) => f.resourceColumn).map((f) => f.id),
  );
  const resourceNames = new Set(
    features
      .filter((f) => f.resourceColumn)
      .map((f) => f.name.toLowerCase()),
  );

  for (const { chains } of columnChains) {
    for (const chain of chains) {
      const links: CombatFeatureChainLink[] = [];
      for (const feat of chain.features) {
        const def = resolveFeatureDef(features, feat.name);
        if (def?.resourceColumn) continue;
        if (resourceNames.has(feat.name.toLowerCase())) continue;
        if (def && resourceIds.has(def.id)) continue;

        links.push({
          featureName: feat.name,
          rarityIndex: feat.rarityIndex,
          def,
          automation: automationForLink(def, feat.name),
        });
      }
      if (links.length === 0) continue;

      const rootDef = links[0].def;
      const chainKey =
        rootDef?.automation?.chainKey?.trim() ||
        rootDef?.id ||
        chain.baseName;

      const existing = byKey.get(chainKey);
      if (existing) {
        existing.links.push(...links);
        existing.links.sort((a, b) => a.rarityIndex - b.rarityIndex);
        existing.introducedAtIndex = Math.min(
          existing.introducedAtIndex,
          chain.introducedAtIndex,
        );
      } else {
        byKey.set(chainKey, {
          chainKey,
          baseName: chain.baseName,
          introducedAtIndex: chain.introducedAtIndex,
          links,
        });
      }
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => a.introducedAtIndex - b.introducedAtIndex,
  );
}

export function resolveChainAtRarity(
  chain: CombatFeatureChain,
  rarityIndex: number,
): ResolvedCombatChain | null {
  const prefix = chain.links.filter((l) => l.rarityIndex <= rarityIndex);
  if (prefix.length === 0) return null;

  const leaf = prefix[prefix.length - 1];
  const effective = mergeAutomationSpecs(prefix.map((l) => l.automation));
  if (effective && !effective.chainKey) {
    effective.chainKey = chain.chainKey;
  }

  return {
    chain,
    prefix,
    leaf,
    effective,
    status: statusForEffective(effective),
    displayName: leaf.def?.name ?? leaf.featureName,
  };
}

export function resolveCombatChainsAtRarity(
  weapon: WeaponActivityCompileSource,
  rarityIndex: number,
): ResolvedCombatChain[] {
  return buildCombatFeatureChains(weapon)
    .map((c) => resolveChainAtRarity(c, rarityIndex))
    .filter((r): r is ResolvedCombatChain => r !== null);
}

/** Ensure every combat feature has chainKey on automation for persistence hygiene. */
export function ensureAutomationChainKeys(
  features: WeaponFeatureDef[],
): WeaponFeatureDef[] {
  const byId = new Map(features.map((f) => [f.id, f]));

  function rootId(f: WeaponFeatureDef, seen = new Set<string>()): string {
    if (!f.upgradesFromId || seen.has(f.id)) return f.id;
    seen.add(f.id);
    const parent = byId.get(f.upgradesFromId);
    if (!parent) return f.id;
    return rootId(parent, seen);
  }

  return features.map((f) => {
    if (f.resourceColumn || !f.automation) return f;
    const key = f.automation.chainKey?.trim() || rootId(f);
    if (f.automation.chainKey === key) return f;
    return {
      ...f,
      automation: { ...f.automation, chainKey: key },
    };
  });
}

/**
 * Build minimal customFeatures from a catalog Weapon rarity table for Foundry
 * export (Amellwind path). Descriptions come from optional-feature map when provided.
 */
export function catalogWeaponToFeatureDefs(
  weapon: Weapon,
  descriptionsByName?: Map<string, string>,
): WeaponFeatureDef[] {
  const seen = new Map<string, WeaponFeatureDef>();
  const chains = buildColumnChains(weapon.rarityRows).filter(({ label }) =>
    isPrimaryFeaturesColumn(label),
  );

  const addName = (name: string) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    const automation = lookupWeaponFeatureAutomation(name);
    seen.set(key, {
      id: `catalog-${key.replace(/[^a-z0-9]+/g, "-")}`,
      name,
      description: descriptionsByName?.get(key) ?? "",
      automation: automation
        ? { ...automation, params: { ...automation.params } }
        : { template: "unmapped", params: {} },
    });
  };

  for (const { chains: colChains } of chains) {
    for (const chain of colChains) {
      for (const feat of chain.features as FeatureAtRarity[]) {
        addName(feat.name);
      }
    }
  }

  // Wire upgradesFromId heuristically via column chains baseName groups
  for (const { chains: colChains } of chains) {
    for (const chain of colChains as FeatureChain[]) {
      const defs = chain.features
        .map((f) => seen.get(f.name.toLowerCase()))
        .filter((d): d is WeaponFeatureDef => !!d);
      for (let i = 1; i < defs.length; i++) {
        const prev = defs[i - 1];
        const cur = defs[i];
        seen.set(cur.name.toLowerCase(), {
          ...cur,
          upgradesFromId: prev.id,
          automation: {
            template: cur.automation?.template ?? "upgrade_scaler",
            chainKey: defs[0].id,
            params: cur.automation?.params ?? {},
            foundryOverrides: cur.automation?.foundryOverrides,
            notes: cur.automation?.notes,
          },
        });
      }
      if (defs[0]) {
        const root = defs[0];
        seen.set(root.name.toLowerCase(), {
          ...root,
          automation: {
            ...(root.automation ?? { template: "unmapped", params: {} }),
            chainKey: root.id,
          },
        });
      }
    }
  }

  return Array.from(seen.values());
}
