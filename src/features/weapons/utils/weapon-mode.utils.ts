import { EquippedWeapon, Weapon, WeaponModeDef } from "@/shared/types";

export interface WeaponGripMode {
  label: string;
  /** Explicit die for this mode when set (forge / data modes). */
  damage?: string;
  /** Legacy key into weapon.dmg1 / dmg2 when `damage` is omitted. */
  damageKey?: "dmg1" | "dmg2";
  hasShield: boolean;
  isTwoHanded: boolean;
  blocksOffHand: boolean;
}

/** @deprecated Use {@link WeaponGripMode} */
export type WeaponSwitchMode = WeaponGripMode;

export interface WeaponGripModeDefinition {
  modes: WeaponGripMode[];
}

/** @deprecated Use {@link WeaponGripModeDefinition} */
export type WeaponSwitchModeDefinition = WeaponGripModeDefinition;

const SWITCH_MODE_WEAPONS: Record<string, WeaponModeDef[]> = {
  "Charge Blade": [
    {
      label: "Sword & Shield",
      damage: "",
      hasShield: true,
      isTwoHanded: false,
      blocksOffHand: true,
    },
    {
      label: "Axe",
      damage: "",
      hasShield: false,
      isTwoHanded: true,
      blocksOffHand: true,
    },
  ],
  "Switch Axe": [
    {
      label: "Axe",
      damage: "",
      hasShield: false,
      isTwoHanded: true,
      blocksOffHand: true,
    },
    {
      label: "Sword",
      damage: "",
      hasShield: false,
      isTwoHanded: false,
      blocksOffHand: false,
    },
  ],
  "Splint Rapier": [
    {
      label: "Single",
      damage: "",
      hasShield: false,
      isTwoHanded: false,
      blocksOffHand: false,
    },
    {
      label: "Splint",
      damage: "",
      hasShield: false,
      isTwoHanded: false,
      blocksOffHand: true,
    },
  ],
};

function modeDefsToGripModes(
  defs: WeaponModeDef[],
  weapon: Weapon,
): WeaponGripMode[] {
  return defs.map((def, index) => {
    const damageKey: "dmg1" | "dmg2" | undefined =
      index === 0 ? "dmg1" : index === 1 ? "dmg2" : undefined;
    const fromKey =
      damageKey != null ? (weapon[damageKey] ?? weapon.dmg1) : weapon.dmg1;
    return {
      label: def.label,
      damage: def.damage.trim() || fromKey,
      damageKey,
      hasShield: def.hasShield === true,
      isTwoHanded: def.isTwoHanded === true,
      blocksOffHand: def.blocksOffHand === true,
    };
  });
}

function buildVersatileGripModes(weapon: Weapon): WeaponGripMode[] {
  const hasShield = weapon.includesShield === true;
  const oneHandLabel = hasShield ? "One-hand + Shield" : "One-hand";

  return [
    {
      label: oneHandLabel,
      damageKey: "dmg1",
      damage: weapon.dmg1,
      hasShield,
      isTwoHanded: false,
      blocksOffHand: hasShield,
    },
    {
      label: "Two-hand",
      damageKey: "dmg2",
      damage: weapon.dmg2 ?? weapon.dmg1,
      hasShield: false,
      isTwoHanded: true,
      blocksOffHand: true,
    },
  ];
}

/** Builtin switch-mode templates keyed by weapon name (AGMH defaults). */
export function getBuiltinSwitchModeDefs(
  weaponName: string,
): WeaponModeDef[] | undefined {
  const defs = SWITCH_MODE_WEAPONS[weaponName];
  if (!defs) return undefined;
  return defs.map((d) => ({ ...d }));
}

/**
 * Resolve editable mode defs for forge / export.
 * Prefers `weapon.modes`, then builtin name table filled with dmg1/dmg2.
 */
export function resolveWeaponModeDefs(weapon: Weapon): WeaponModeDef[] | undefined {
  if (weapon.properties.includes("V")) return undefined;

  if (weapon.modes && weapon.modes.length >= 2) {
    return weapon.modes.map((m) => ({
      label: m.label,
      damage: m.damage.trim() || weapon.dmg1,
      hasShield: m.hasShield,
      isTwoHanded: m.isTwoHanded,
      blocksOffHand: m.blocksOffHand,
    }));
  }

  const builtin = getBuiltinSwitchModeDefs(weapon.name);
  if (!builtin || !weapon.dmg2) return undefined;

  return builtin.map((def, index) => ({
    ...def,
    damage: index === 0 ? weapon.dmg1 : (weapon.dmg2 ?? weapon.dmg1),
  }));
}

/** MH weapons with Switch Mode that are not PHB versatile (V). */
export function hasWeaponSwitchModes(weapon: Weapon): boolean {
  if (weapon.properties.includes("V")) return false;
  if (weapon.modes && weapon.modes.length >= 2) return true;
  return !!weapon.dmg2 && !!SWITCH_MODE_WEAPONS[weapon.name];
}

export function getWeaponSwitchModeDefinition(
  weapon: Weapon,
): WeaponGripModeDefinition | undefined {
  const defs = resolveWeaponModeDefs(weapon);
  if (!defs || defs.length < 2) return undefined;
  return { modes: modeDefsToGripModes(defs, weapon) };
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

export function getWeaponModeIndex(equipped: EquippedWeapon): number {
  const definition = getWeaponGripModeDefinition(equipped.weapon);
  const max = definition ? definition.modes.length - 1 : 0;
  const index = equipped.activeModeIndex ?? 0;
  if (index < 0) return 0;
  if (index > max) return max;
  return index;
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

export function resolveGripModeDamage(
  weapon: Weapon,
  mode: WeaponGripMode,
): string {
  if (mode.damage?.trim()) return mode.damage.trim();
  if (mode.damageKey) return weapon[mode.damageKey] ?? weapon.dmg1;
  return weapon.dmg1;
}

export function getActiveWeaponDamage(equipped: EquippedWeapon): string {
  const gripMode = getActiveWeaponGripMode(equipped);
  if (gripMode) return resolveGripModeDamage(equipped.weapon, gripMode);
  return equipped.weapon.dmg1;
}

export function getActiveWeaponDamageLabel(equipped: EquippedWeapon): string {
  return getActiveWeaponGripMode(equipped)?.label ?? "Damage";
}

export function getWeaponGripModeHint(mode: WeaponGripMode): string {
  if (mode.hasShield) return "Integrated shield occupies the off-hand";
  if (mode.isTwoHanded) return "Requires both hands";
  return "Off-hand free";
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

/** Sync dmg1 / dmg2 from a modes list for 5etools compatibility. */
export function syncDamageFromModes(modes: WeaponModeDef[]): {
  dmg1: string;
  dmg2: string | undefined;
} {
  const dmg1 = modes[0]?.damage.trim() || "1d8";
  const dmg2 =
    modes.length >= 2 ? modes[1]?.damage.trim() || undefined : undefined;
  return { dmg1, dmg2 };
}

/** Default two-mode seed for forge when enabling switch modes. */
export function createDefaultForgeModes(
  dmg1 = "1d8",
  dmg2 = "1d8",
): WeaponModeDef[] {
  return [
    {
      label: "Mode A",
      damage: dmg1,
      isTwoHanded: true,
      blocksOffHand: true,
      hasShield: false,
    },
    {
      label: "Mode B",
      damage: dmg2 || dmg1,
      isTwoHanded: false,
      blocksOffHand: false,
      hasShield: false,
    },
  ];
}
