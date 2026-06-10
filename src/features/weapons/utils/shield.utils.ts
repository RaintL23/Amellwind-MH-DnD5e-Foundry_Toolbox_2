import { EquippedWeapon, Weapon } from "@/shared/types";
import {
  doesSwitchModeHaveShield,
  hasWeaponSwitchModes,
} from "./weapon-mode.utils";

/** Weapons sold with an integrated shield (`ac` field in source data). */
export function weaponIncludesShield(weapon: Weapon): boolean {
  return weapon.includesShield === true;
}

/**
 * Integrated shield is active on any shield weapon except versatile ones
 * wielded two-handed. Weapons with a native 2H property (Gunlance, Lance, etc.)
 * still keep their shield AC.
 */
export function hasActiveIntegratedShield(
  equipped: EquippedWeapon | null,
): boolean {
  if (!equipped || !weaponIncludesShield(equipped.weapon)) return false;
  const { weapon, useVersatile } = equipped;
  if (hasWeaponSwitchModes(weapon)) {
    return doesSwitchModeHaveShield(equipped);
  }
  return !(weapon.properties.includes("V") && useVersatile);
}

function parseAcBonusColumn(value: string | string[] | undefined): number {
  if (!value) return 0;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === "-") return 0;
  const match = raw.match(/\+(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function findAcBonusColumnValue(
  columns: Record<string, string | string[]>,
): string | string[] | undefined {
  const entry = Object.entries(columns).find(([label]) =>
    /ac bonus/i.test(label),
  );
  return entry?.[1];
}

/** Total shield AC: base `ac` (+2) plus the rarity table's AC Bonus column. */
export function getWeaponShieldAcBonus(weapon: Weapon, rarity: string): number {
  if (!weaponIncludesShield(weapon)) return 0;

  const base = weapon.acBonus ?? 0;
  const row = weapon.rarityRows.find((r) => r.rarity === rarity);
  if (!row) return base;

  return base + parseAcBonusColumn(findAcBonusColumnValue(row.columns));
}

export function getWeaponShieldAcBonusAtIndex(weapon: Weapon, rarityIndex: number): number {
  const rarity = weapon.rarityRows[rarityIndex]?.rarity ?? "Common";
  return getWeaponShieldAcBonus(weapon, rarity);
}
