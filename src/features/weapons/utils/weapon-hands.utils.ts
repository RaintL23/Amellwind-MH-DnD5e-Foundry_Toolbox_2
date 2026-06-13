import type { StandaloneShieldItem } from "@/features/builder/data/shield.data";
import { EquippedWeapon, Weapon } from "@/shared/types";
import type { WeaponGripMode } from "./weapon-mode.utils";
import {
  doesGripModeBlockOffHand,
  hasWeaponGripModes,
  isGripModeTwoHanded,
} from "./weapon-mode.utils";

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
  if (hasWeaponGripModes(equipped.weapon)) {
    return isGripModeTwoHanded(equipped);
  }
  if (equipped.weapon.properties.includes("2H")) return true;
  return false;
}

export function blocksOffHand(mainHand: EquippedWeapon | null): boolean {
  if (!mainHand) return false;
  if (hasWeaponGripModes(mainHand.weapon)) {
    return (
      doesGripModeBlockOffHand(mainHand) ||
      occupiesBothGripSlots(mainHand.weapon)
    );
  }
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
  "two-handed": "Two-handed weapon",
  "both-grip": "Both hands occupied",
  "integrated-shield": "Integrated shield occupies the off-hand",
};

export function getOffHandWeaponBlockLabel(
  reason: OffHandWeaponBlockReason,
): string {
  return OFF_HAND_WEAPON_BLOCK_LABELS[reason];
}

/** Whether the off-hand is taken by a weapon, standalone shield, or integrated shield. */
export function isOffHandSlotOccupied(
  offHand: EquippedWeapon | null,
  equippedShield: StandaloneShieldItem | null,
  hasIntegratedShield: boolean,
): boolean {
  return !!offHand || !!equippedShield || hasIntegratedShield;
}

/** Off-hand can show the weapon picker (empty or only a replaceable standalone shield). */
export function isOffHandWeaponPickerAvailable(
  offHand: EquippedWeapon | null,
  _equippedShield: StandaloneShieldItem | null,
  hasIntegratedShield: boolean,
  isOffHandBlocked: boolean,
): boolean {
  // Standalone shields are replaceable from the weapon picker; they do not block it.
  if (hasIntegratedShield || isOffHandBlocked || offHand) return false;
  return true;
}

const OFF_HAND_GRIP_BLOCK_HINT = "The off-hand is occupied";
const MAIN_HAND_GRIP_BLOCK_HINT = "The main hand is occupied";

export interface GripModeSlotContext {
  weaponSlot: "mainHand" | "offHand";
  offHandOccupied: boolean;
  mainHandOccupied: boolean;
}

export function isGripModeBlockedByOccupiedHand(
  mode: WeaponGripMode,
  context: GripModeSlotContext,
): boolean {
  if (!mode.isTwoHanded) return false;
  if (context.weaponSlot === "mainHand" && context.offHandOccupied) return true;
  if (context.weaponSlot === "offHand" && context.mainHandOccupied) return true;
  return false;
}

export function getGripModeOccupiedHandHint(
  mode: WeaponGripMode,
  context: GripModeSlotContext,
): string | undefined {
  if (!isGripModeBlockedByOccupiedHand(mode, context)) return undefined;
  return context.weaponSlot === "mainHand"
    ? OFF_HAND_GRIP_BLOCK_HINT
    : MAIN_HAND_GRIP_BLOCK_HINT;
}
