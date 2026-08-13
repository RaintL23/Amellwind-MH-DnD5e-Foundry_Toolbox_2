import {
  OptionalFeature,
  PROPERTY_DESCRIPTIONS,
  PROPERTY_LABELS,
  Weapon,
  isWeaponFeatureColumn,
} from "@/shared/types";
import { mapOptionalFeature } from "../mappers/optionalfeature.mapper";
import { getOptionalFeaturesRaw } from "@/shared/db/sync.service";

function collectColumnFeatureNames(weapon: Weapon): Set<string> {
  const names = new Set<string>();
  for (const row of weapon.rarityRows) {
    for (const [label, val] of Object.entries(row.columns)) {
      if (!isWeaponFeatureColumn(label)) continue;
      const items = Array.isArray(val) ? val : [val];
      for (const name of items) {
        if (name) names.add(name.toLowerCase());
      }
    }
  }
  return names;
}

/**
 * Resolves optional features that apply at every rarity for a weapon:
 * - MH-specific weapon properties with descriptions (e.g. MHL → Loading)
 * - {@optfeature} references in the weapon inset text (baseFeatureNames)
 * - optional features whose prerequisite is the weapon name with no rarity suffix
 *   (e.g. Rapid Fire / Overheat on Light Bowgun) — skip for forge/RaintDM weapons
 *
 * Features already listed in rarity-table columns (Ammo (LBG), Hunting Horn
 * notes, …) stay in those columns so they are not duplicated under Features.
 */
export function resolveWeaponBaseFeatures(
  weapon: Weapon,
  featuresMap: Map<string, OptionalFeature>,
  options: { includePrerequisiteMatches?: boolean } = {},
): OptionalFeature[] {
  const includePrerequisiteMatches = options.includePrerequisiteMatches !== false;
  const columnNames = collectColumnFeatureNames(weapon);
  const seen = new Set<string>();
  const result: OptionalFeature[] = [];

  const add = (feat: OptionalFeature | undefined) => {
    if (!feat) return;
    const key = feat.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(feat);
  };

  for (const prop of weapon.properties) {
    const description = PROPERTY_DESCRIPTIONS[prop];
    if (!description) continue;
    add({
      name: PROPERTY_LABELS[prop] ?? prop,
      source: weapon.source,
      featureType: [],
      weaponName: weapon.name,
      paragraphs: [description],
    });
  }

  for (const name of weapon.baseFeatureNames) {
    add(featuresMap.get(name.toLowerCase()));
  }

  if (includePrerequisiteMatches) {
    for (const feat of featuresMap.values()) {
      if (feat.weaponName.toLowerCase() !== weapon.name.toLowerCase()) continue;
      if (feat.prerequisiteRarity) continue;

      if (columnNames.has(feat.name.toLowerCase())) continue;

      add(feat);
    }
  }

  return result.sort(
    (a, b) =>
      (a.page ?? 0) - (b.page ?? 0) || a.name.localeCompare(b.name),
  );
}

/** Keyed by lowercase feature name for O(1) lookup */
let cache: Map<string, OptionalFeature> | null = null;

export async function getOptionalFeaturesMap(): Promise<Map<string, OptionalFeature>> {
  if (cache) return cache;

  const raw = await getOptionalFeaturesRaw();
  cache = new Map();

  for (const item of raw) {
    const feature = mapOptionalFeature(item);
    if (feature.name) {
      cache.set(feature.name.toLowerCase(), feature);
    }
  }

  return cache;
}

export function clearOptionalFeaturesCache(): void {
  cache = null;
}
