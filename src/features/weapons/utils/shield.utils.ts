import { Weapon } from "@/shared/types";

/** Weapons sold with an integrated shield (`ac` field in source data). */
export function weaponIncludesShield(weapon: Weapon): boolean {
  return weapon.includesShield === true;
}

function parseAcBonusColumn(value: string | string[] | undefined): number {
  if (!value) return 0;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === "-") return 0;
  const match = raw.match(/\+(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

/** Total shield AC: base `ac` (+2) plus the rarity table's AC Bonus column. */
export function getWeaponShieldAcBonus(weapon: Weapon, rarity: string): number {
  if (!weaponIncludesShield(weapon)) return 0;

  const base = weapon.acBonus ?? 0;
  const row = weapon.rarityRows.find((r) => r.rarity === rarity);
  if (!row) return base;

  return base + parseAcBonusColumn(row.columns["AC Bonus"]);
}

export function getWeaponShieldAcBonusAtIndex(weapon: Weapon, rarityIndex: number): number {
  const rarity = weapon.rarityRows[rarityIndex]?.rarity ?? "Common";
  return getWeaponShieldAcBonus(weapon, rarity);
}
