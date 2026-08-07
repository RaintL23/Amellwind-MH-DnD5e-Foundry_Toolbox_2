import type { Weapon, OptionalFeature } from "@/shared/types";
import type { CustomWeapon } from "@/features/weapon-forge/types/weapon-forge.types";
import {
  buildWeaponFoundryExportBundle,
  buildWeaponFoundryItem,
} from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";
import { exportWeaponFoundryJson } from "@/features/weapon-forge/services/weapon-forge.service";
import { catalogWeaponToFeatureDefs } from "@/shared/foundry/weapons";
import type { FoundryItem } from "@/shared/foundry";
import { downloadFoundryJson } from "@/shared/foundry";

export { downloadFoundryJson };

function descriptionsFromOptionalFeatures(
  featuresMap?: Map<string, OptionalFeature>,
): Map<string, string> | undefined {
  if (!featuresMap || featuresMap.size === 0) return undefined;
  const out = new Map<string, string>();
  for (const [key, feat] of featuresMap) {
    const text = feat.paragraphs?.join("\n\n") ?? "";
    out.set(key.toLowerCase(), text);
    out.set(feat.name.toLowerCase(), text);
  }
  return out;
}

/** Adapt a catalog Amellwind `Weapon` into `CustomWeapon` for Foundry export. */
export function weaponToExportCustomWeapon(
  weapon: Weapon,
  featuresMap?: Map<string, OptionalFeature>,
): CustomWeapon {
  const slug = weapon.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const customFeatures = catalogWeaponToFeatureDefs(
    weapon,
    descriptionsFromOptionalFeatures(featuresMap),
  );
  return {
    ...weapon,
    id: `amellwind-${slug}`,
    // Stable markers — not written into Foundry Item fields.
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
    isCustom: false,
    author: "Amellwind",
    customFeatures,
  };
}

function stampAmellwindWeaponFlags(
  item: FoundryItem,
  weapon: Weapon,
): FoundryItem {
  item.flags = {
    ...item.flags,
    "amellwind-toolbox": {
      ...(typeof item.flags["amellwind-toolbox"] === "object" &&
      item.flags["amellwind-toolbox"] !== null
        ? (item.flags["amellwind-toolbox"] as Record<string, unknown>)
        : {}),
      baseWeaponName: weapon.name,
      exportKind: "amellwind-weapon",
    },
  };
  return item;
}

/**
 * Canonical Foundry Item for Amellwind catalog weapons. Preview and Export
 * must both use this (or download a memoized result of this).
 */
export function buildAmellwindWeaponFoundryItem(
  weapon: Weapon,
  rarityIndex: number,
  featuresMap?: Map<string, OptionalFeature>,
): FoundryItem {
  const custom = weaponToExportCustomWeapon(weapon, featuresMap);
  const item = buildWeaponFoundryItem(custom, rarityIndex);
  return stampAmellwindWeaponFlags(item, weapon);
}

export function exportAmellwindWeaponFoundryJson(
  weapon: Weapon,
  rarityIndex: number,
  featuresMap?: Map<string, OptionalFeature>,
  /** When provided, downloads this exact weapon payload (must match preview). */
  item?: FoundryItem,
  options?: { includeResources?: boolean },
): void {
  const custom = weaponToExportCustomWeapon(weapon, featuresMap);
  const payload = stampAmellwindWeaponFlags(
    item ?? buildWeaponFoundryExportBundle(custom, rarityIndex).weapon,
    weapon,
  );
  exportWeaponFoundryJson(custom, rarityIndex, payload, options);
}
