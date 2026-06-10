import { EquippedWeapon, Weapon } from "@/shared/types";

export interface WeaponSwitchMode {
  label: string;
  damageKey: "dmg1" | "dmg2";
  hasShield: boolean;
  isTwoHanded: boolean;
  blocksOffHand: boolean;
}

export interface WeaponSwitchModeDefinition {
  modes: [WeaponSwitchMode, WeaponSwitchMode];
}

const SWITCH_MODE_WEAPONS: Record<string, WeaponSwitchModeDefinition> = {
  "Charge Blade": {
    modes: [
      {
        label: "Sword & Shield",
        damageKey: "dmg1",
        hasShield: true,
        isTwoHanded: false,
        blocksOffHand: true,
      },
      {
        label: "Axe",
        damageKey: "dmg2",
        hasShield: false,
        isTwoHanded: true,
        blocksOffHand: true,
      },
    ],
  },
  "Switch Axe": {
    modes: [
      {
        label: "Axe",
        damageKey: "dmg1",
        hasShield: false,
        isTwoHanded: true,
        blocksOffHand: true,
      },
      {
        label: "Sword",
        damageKey: "dmg2",
        hasShield: false,
        isTwoHanded: false,
        blocksOffHand: false,
      },
    ],
  },
  "Splint Rapier": {
    modes: [
      {
        label: "Single",
        damageKey: "dmg1",
        hasShield: false,
        isTwoHanded: false,
        blocksOffHand: false,
      },
      {
        label: "Splint",
        damageKey: "dmg2",
        hasShield: false,
        isTwoHanded: false,
        blocksOffHand: true,
      },
    ],
  },
};

/** MH weapons with Switch Mode (dmg2) that are not PHB versatile (V). */
export function hasWeaponSwitchModes(weapon: Weapon): boolean {
  return !!weapon.dmg2 && !weapon.properties.includes("V") && !!SWITCH_MODE_WEAPONS[weapon.name];
}

export function getWeaponSwitchModeDefinition(
  weapon: Weapon,
): WeaponSwitchModeDefinition | undefined {
  if (!hasWeaponSwitchModes(weapon)) return undefined;
  return SWITCH_MODE_WEAPONS[weapon.name];
}

export function isVersatileGripWeapon(weapon: Weapon): boolean {
  return weapon.properties.includes("V") && !!weapon.dmg2;
}

export function getWeaponModeIndex(equipped: EquippedWeapon): 0 | 1 {
  return equipped.useVersatile ? 1 : 0;
}

export function getActiveWeaponSwitchMode(
  equipped: EquippedWeapon,
): WeaponSwitchMode | undefined {
  const definition = getWeaponSwitchModeDefinition(equipped.weapon);
  if (!definition) return undefined;
  return definition.modes[getWeaponModeIndex(equipped)];
}

export function getActiveWeaponDamage(equipped: EquippedWeapon): string {
  const switchMode = getActiveWeaponSwitchMode(equipped);
  if (switchMode) {
    return equipped.weapon[switchMode.damageKey] ?? equipped.weapon.dmg1;
  }

  if (equipped.useVersatile && equipped.weapon.dmg2) {
    return equipped.weapon.dmg2;
  }

  return equipped.weapon.dmg1;
}

export function getActiveWeaponDamageLabel(equipped: EquippedWeapon): string {
  const switchMode = getActiveWeaponSwitchMode(equipped);
  if (switchMode) return switchMode.label;

  if (isVersatileGripWeapon(equipped.weapon)) {
    return equipped.useVersatile ? "Two-hand" : "One-hand";
  }

  return "Damage";
}

export function isSwitchModeTwoHanded(equipped: EquippedWeapon): boolean {
  const mode = getActiveWeaponSwitchMode(equipped);
  return mode?.isTwoHanded ?? false;
}

export function doesSwitchModeBlockOffHand(equipped: EquippedWeapon): boolean {
  const mode = getActiveWeaponSwitchMode(equipped);
  return mode?.blocksOffHand ?? false;
}

export function doesSwitchModeHaveShield(equipped: EquippedWeapon): boolean {
  const mode = getActiveWeaponSwitchMode(equipped);
  return mode?.hasShield ?? false;
}
