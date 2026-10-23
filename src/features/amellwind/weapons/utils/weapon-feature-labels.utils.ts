import {
  isWeaponFeatureColumn,
  type OptionalFeature,
  type Weapon,
  type WeaponRarityRow,
} from "@/shared/types";

/**
 * Renames optfeature keys ("Ammo (HBG)", "Capacity Increase (HBG, Very Rare)")
 * to their display labels while keeping names unique inside the weapon: a
 * repeated label gets its rarity ("Capacity Increase (Very Rare)"). Returns the
 * renamed weapon plus a features map keyed by the new names. Used when an
 * Amellwind weapon is copied into the Weapon Forge, where names are editable.
 */
export function localizeWeaponFeatureNames(
  weapon: Weapon,
  featuresMap: Map<string, OptionalFeature>,
): { weapon: Weapon; featuresMap: Map<string, OptionalFeature> } {
  const labels = weapon.featureLabels;
  if (!labels) return { weapon, featuresMap };

  const renamed = new Map<string, string>();
  const used = new Set<string>();

  const rename = (key: string, rarity?: string): string => {
    const lower = key.toLowerCase();
    const existing = renamed.get(lower);
    if (existing) return existing;
    const label = labels[lower] ?? key;
    let name =
      used.has(label.toLowerCase()) && rarity ? `${label} (${rarity})` : label;
    if (used.has(name.toLowerCase())) name = key;
    used.add(name.toLowerCase());
    renamed.set(lower, name);
    return name;
  };

  const baseFeatureNames = weapon.baseFeatureNames.map((name) => rename(name));
  const rarityRows: WeaponRarityRow[] = weapon.rarityRows.map((row) => ({
    ...row,
    columns: Object.fromEntries(
      Object.entries(row.columns).map(([label, val]) => {
        if (!isWeaponFeatureColumn(label)) return [label, val];
        return [
          label,
          Array.isArray(val)
            ? val.map((name) => rename(name, row.rarity))
            : rename(val, row.rarity),
        ];
      }),
    ),
  }));

  const localMap = new Map(featuresMap);
  for (const [key, name] of renamed) {
    const feature = featuresMap.get(key);
    if (!feature) continue;
    // Drop the key entry so prerequisite matching cannot re-add it.
    localMap.delete(key);
    localMap.set(name.toLowerCase(), { ...feature, name });
  }

  return {
    weapon: {
      ...weapon,
      baseFeatureNames,
      rarityRows,
      featureLabels: undefined,
    },
    featuresMap: localMap,
  };
}
