import type { Weapon, OptionalFeature } from "@/shared/types";
import type { CustomWeapon } from "@/features/weapon-forge/types/weapon-forge.types";
import {
  buildWeaponFoundryItem,
  foundryItemFilename,
} from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";
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

export function exportAmellwindWeaponFoundryJson(
  weapon: Weapon,
  rarityIndex: number,
  featuresMap?: Map<string, OptionalFeature>,
  /** When provided, downloads this exact payload (must match preview). */
  item?: FoundryItem,
): void {
  const payload =
    item ?? buildAmellwindWeaponFoundryItem(weapon, rarityIndex, featuresMap);
  const custom = weaponToExportCustomWeapon(weapon, featuresMap);
  downloadFoundryJson(payload, foundryItemFilename(custom, rarityIndex));
}
