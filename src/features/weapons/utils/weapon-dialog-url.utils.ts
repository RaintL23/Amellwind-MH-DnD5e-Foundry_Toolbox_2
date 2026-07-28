import type { WeaponRarityRow } from "@/shared/types";

export const WEAPON_DIALOG_URL_KEYS = {
  weapon: "weapon",
  rarity: "rarity",
} as const;

export interface WeaponUrlIdentifiable {
  id?: string;
  name: string;
  isCustom?: boolean;
}

/** Stable share key: custom forge weapons use id; everything else uses name. */
export function getWeaponUrlKey(weapon: WeaponUrlIdentifiable): string {
  if (weapon.isCustom && weapon.id) return weapon.id;
  return weapon.name;
}

export function findWeaponByUrlKey<T extends WeaponUrlIdentifiable>(
  weapons: T[],
  key: string,
): T | undefined {
  if (!key) return undefined;
  const decoded = decodeURIComponent(key);
  return (
    weapons.find((w) => w.id === decoded) ??
    weapons.find((w) => w.name.toLowerCase() === decoded.toLowerCase())
  );
}

export function rarityParamToIndex(
  rows: WeaponRarityRow[],
  rarityParam: string | null,
): number {
  if (!rarityParam || rows.length === 0) return 0;
  const decoded = decodeURIComponent(rarityParam);
  const idx = rows.findIndex(
    (row) => row.rarity.toLowerCase() === decoded.toLowerCase(),
  );
  return idx >= 0 ? idx : 0;
}

export function rarityIndexToParam(
  rows: WeaponRarityRow[],
  index: number,
): string {
  return rows[index]?.rarity ?? "";
}
