import type { Weapon } from "@/shared/types";
import type { CustomWeapon } from "../types/weapon-forge.types";

/**
 * True for curated/user Weapon Forge weapons (raintdm JSON / localStorage).
 * AGMH `/weapons` catalog entries never carry `isCustom` or `customFeatures`.
 */
export function isWeaponForgeWeapon(weapon: Weapon): weapon is CustomWeapon {
  const forge = weapon as CustomWeapon;
  return (
    typeof forge.isCustom === "boolean" || Array.isArray(forge.customFeatures)
  );
}
