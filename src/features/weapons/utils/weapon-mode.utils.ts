import { EquippedWeapon, Weapon } from "@/shared/types";

export interface WeaponGripMode {
  label: string;
  damageKey: "dmg1" | "dmg2";
  hasShield: boolean;
  isTwoHanded: boolean;
  blocksOffHand: boolean;
}

/** @deprecated Use {@link WeaponGripMode} */
export type WeaponSwitchMode = WeaponGripMode;

export interface WeaponGripModeDefinition {
  modes: [WeaponGripMode, WeaponGripMode];
}

/** @deprecated Use {@link WeaponGripModeDefinition} */
export type WeaponSwitchModeDefinition = WeaponGripModeDefinition;

const SWITCH_MODE_WEAPONS: Record<string, WeaponGripModeDefinition> = {
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

function buildVersatileGripModes(weapon: Weapon): [WeaponGripMode, WeaponGripMode] {
  const hasShield = weapon.includesShield === true;
  const oneHandLabel = hasShield ? "One-hand + Shield" : "One-hand";

  return [
    {
      label: oneHandLabel,
      damageKey: "dmg1",
      hasShield,
      isTwoHanded: false,
      blocksOffHand: hasShield,
    },
    {
      label: "Two-hand",
      damageKey: "dmg2",
      hasShield: false,
      isTwoHanded: true,
      blocksOffHand: true,
    },
  ];
}

/** MH weapons with Switch Mode (dmg2) that are not PHB versatile (V). */
export function hasWeaponSwitchModes(weapon: Weapon): boolean {
  return !!weapon.dmg2 && !weapon.properties.includes("V") && !!SWITCH_MODE_WEAPONS[weapon.name];
}

export function getWeaponSwitchModeDefinition(
  weapon: Weapon,
): WeaponGripModeDefinition | undefined {
  if (!hasWeaponSwitchModes(weapon)) return undefined;
  return SWITCH_MODE_WEAPONS[weapon.name];
}

export function isVersatileGripWeapon(weapon: Weapon): boolean {
  return weapon.properties.includes("V") && !!weapon.dmg2;
}

export function hasWeaponGripModes(weapon: Weapon): boolean {
  return hasWeaponSwitchModes(weapon) || isVersatileGripWeapon(weapon);
}

export function getWeaponGripModeDefinition(
  weapon: Weapon,
): WeaponGripModeDefinition | undefined {
  const switchDefinition = getWeaponSwitchModeDefinition(weapon);
  if (switchDefinition) return switchDefinition;

  if (!isVersatileGripWeapon(weapon)) return undefined;
  return { modes: buildVersatileGripModes(weapon) };
}

export function getWeaponModeIndex(equipped: EquippedWeapon): 0 | 1 {
  return equipped.useVersatile ? 1 : 0;
}

export function getActiveWeaponGripMode(
  equipped: EquippedWeapon,
): WeaponGripMode | undefined {
  const definition = getWeaponGripModeDefinition(equipped.weapon);
  if (!definition) return undefined;
  return definition.modes[getWeaponModeIndex(equipped)];
}

/** @deprecated Use {@link getActiveWeaponGripMode} */
export function getActiveWeaponSwitchMode(
  equipped: EquippedWeapon,
): WeaponGripMode | undefined {
  return getActiveWeaponGripMode(equipped);
}

export function getActiveWeaponDamage(equipped: EquippedWeapon): string {
  const gripMode = getActiveWeaponGripMode(equipped);
  if (gripMode) {
    return equipped.weapon[gripMode.damageKey] ?? equipped.weapon.dmg1;
  }

  return equipped.weapon.dmg1;
}

export function getActiveWeaponDamageLabel(equipped: EquippedWeapon): string {
  return getActiveWeaponGripMode(equipped)?.label ?? "Damage";
}

export function getWeaponGripModeHint(mode: WeaponGripMode): string {
  if (mode.hasShield) return "Escudo integrado en mano secundaria";
  if (mode.isTwoHanded) return "Requiere ambas manos";
  return "Mano secundaria libre";
}

export function isGripModeTwoHanded(equipped: EquippedWeapon): boolean {
  const mode = getActiveWeaponGripMode(equipped);
  if (mode) return mode.isTwoHanded;
  return equipped.weapon.properties.includes("2H");
}

/** @deprecated Use {@link isGripModeTwoHanded} */
export function isSwitchModeTwoHanded(equipped: EquippedWeapon): boolean {
  return isGripModeTwoHanded(equipped);
}

export function doesGripModeBlockOffHand(equipped: EquippedWeapon): boolean {
  const mode = getActiveWeaponGripMode(equipped);
  return mode?.blocksOffHand ?? false;
}

/** @deprecated Use {@link doesGripModeBlockOffHand} */
export function doesSwitchModeBlockOffHand(equipped: EquippedWeapon): boolean {
  return doesGripModeBlockOffHand(equipped);
}

export function doesGripModeHaveShield(equipped: EquippedWeapon): boolean {
  const mode = getActiveWeaponGripMode(equipped);
  return mode?.hasShield ?? false;
}

/** @deprecated Use {@link doesGripModeHaveShield} */
export function doesSwitchModeHaveShield(equipped: EquippedWeapon): boolean {
  return doesGripModeHaveShield(equipped);
}
