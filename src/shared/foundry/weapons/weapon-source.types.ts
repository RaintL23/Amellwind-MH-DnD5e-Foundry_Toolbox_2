import type { WeaponRarityRow } from "@/shared/types";
import type { WeaponFeatureAutomationSpec } from "./activity.types";

/**
 * Minimal feature definition for Foundry weapon automation (domain-agnostic).
 * Forge `WeaponForgeFeatureDef` is structurally compatible.
 */
export interface WeaponFeatureDef {
  id: string;
  name: string;
  description: string;
  upgradesFromId?: string;
  resourceColumn?: string;
  automation?: WeaponFeatureAutomationSpec;
}

/**
 * Minimal weapon shape for compiling Foundry activities / combat chains.
 * Accepts forge CustomWeapon and catalog-adapted exports.
 */
export interface WeaponActivityCompileSource {
  rarityRows: WeaponRarityRow[];
  customFeatures?: WeaponFeatureDef[];
}
