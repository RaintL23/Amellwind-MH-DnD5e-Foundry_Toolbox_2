import { EquippedWeapon, Weapon } from "@/shared/types";

/** Weapons that occupy both grip slots without the native 2H property. */
export function occupiesBothGripSlots(weapon: Weapon): boolean {
  return /\bdual\b/i.test(weapon.name) || /\btonfa/i.test(weapon.name);
}

/** Weapons whose name includes "Dual" occupy both weapon grip slots. */
export function isDualGripWeapon(weapon: Weapon): boolean {
  return /\bdual\b/i.test(weapon.name);
}

/** @deprecated Prefer {@link occupiesBothGripSlots} or {@link isDualGripWeapon} */
export const isDualBladesWeapon = isDualGripWeapon;

export function isWeaponTwoHanded(equipped: EquippedWeapon | null): boolean {
  if (!equipped) return false;
  if (equipped.weapon.properties.includes("2H")) return true;
  if (equipped.weapon.properties.includes("V") && equipped.useVersatile) return true;
  return false;
}

export function blocksOffHand(mainHand: EquippedWeapon | null): boolean {
  if (!mainHand) return false;
  return isWeaponTwoHanded(mainHand) || occupiesBothGripSlots(mainHand.weapon);
}

export type OffHandBlockReason = "two-handed" | "both-grip";

export function getOffHandBlockReason(
  mainHand: EquippedWeapon | null,
): OffHandBlockReason | null {
  if (!mainHand) return null;
  if (occupiesBothGripSlots(mainHand.weapon)) return "both-grip";
  if (isWeaponTwoHanded(mainHand)) return "two-handed";
  return null;
}

export type OffHandWeaponBlockReason =
  | "two-handed"
  | "both-grip"
  | "integrated-shield";

/** Whether a weapon can be placed in the off-hand slot. */
export function canEquipInOffHand(weapon: Weapon): boolean {
  return getOffHandWeaponBlockReason(weapon) === null;
}

export function getOffHandWeaponBlockReason(
  weapon: Weapon,
): OffHandWeaponBlockReason | null {
  if (weapon.properties.includes("2H")) return "two-handed";
  if (occupiesBothGripSlots(weapon)) return "both-grip";
  if (weapon.includesShield) return "integrated-shield";
  return null;
}

const OFF_HAND_WEAPON_BLOCK_LABELS: Record<OffHandWeaponBlockReason, string> = {
  "two-handed": "Arma a dos manos",
  "both-grip": "Ocupa ambas manos",
  "integrated-shield": "Escudo integrado ocupa la mano secundaria",
};

export function getOffHandWeaponBlockLabel(
  reason: OffHandWeaponBlockReason,
): string {
  return OFF_HAND_WEAPON_BLOCK_LABELS[reason];
}
