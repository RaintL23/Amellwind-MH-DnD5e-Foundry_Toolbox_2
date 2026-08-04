import type { FoundryItem } from "../types";
import { resolveCombatChainsAtRarity } from "./activity-chains";
import type { WeaponActivityCompileSource } from "./weapon-source.types";
import { compileResolvedChain } from "./activity-emit";

export { foundryIdFromSeed } from "../id";

export interface CompileWeaponFeatureActivitiesOptions {
  magical?: boolean;
}

/**
 * Chain-first compiler: for each combat feature chain unlocked at rarityIndex,
 * emit Activity/AE payload(s) with merged params (never one emit per upgrade row).
 */
export function compileWeaponFeatureActivities(
  item: FoundryItem,
  weapon: WeaponActivityCompileSource,
  rarityIndex: number,
  options: CompileWeaponFeatureActivitiesOptions = {},
) {
  const resolved = resolveCombatChainsAtRarity(weapon, rarityIndex);
  const magical = options.magical === true;

  let sort = 100_000;
  for (const chain of resolved) {
    compileResolvedChain(item, chain, { magical, sortBase: sort });
    sort += 100_000;
  }

  return resolved;
}
