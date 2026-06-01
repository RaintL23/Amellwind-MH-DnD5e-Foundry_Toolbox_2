import { EquippedWeapon, Weapon } from "@/shared/types";

/** Weapons that occupy both hands despite lacking the 2H property. */
export function isDualBladesWeapon(weapon: Weapon): boolean {
  return weapon.name === "Dual Blades";
}

export function isWeaponTwoHanded(equipped: EquippedWeapon | null): boolean {
  if (!equipped) return false;
  if (equipped.weapon.properties.includes("2H")) return true;
  if (equipped.weapon.properties.includes("V") && equipped.useVersatile) return true;
  return false;
}

export function blocksOffHand(mainHand: EquippedWeapon | null): boolean {
  if (!mainHand) return false;
  return isWeaponTwoHanded(mainHand) || isDualBladesWeapon(mainHand.weapon);
}

export type OffHandBlockReason = "two-handed" | "dual-blades";

export function getOffHandBlockReason(
  mainHand: EquippedWeapon | null,
): OffHandBlockReason | null {
  if (!mainHand) return null;
  if (isDualBladesWeapon(mainHand.weapon)) return "dual-blades";
  if (isWeaponTwoHanded(mainHand)) return "two-handed";
  return null;
}
