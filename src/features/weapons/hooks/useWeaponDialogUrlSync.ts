import { useCallback } from "react";
import { useListUrlState } from "@/shared/hooks/useListUrlState";
import type { Weapon, WeaponRarityRow } from "@/shared/types";
import {
  WEAPON_DIALOG_URL_KEYS,
  getWeaponUrlKey,
  rarityIndexToParam,
  rarityParamToIndex,
} from "../utils/weapon-dialog-url.utils";

export function useWeaponDialogUrlSync() {
  const { getString, patchFields } = useListUrlState();

  const urlWeaponKey = getString(WEAPON_DIALOG_URL_KEYS.weapon);
  const urlRarityParam = getString(WEAPON_DIALOG_URL_KEYS.rarity);

  const syncOpen = useCallback(
    (weapon: Weapon, rarityIndex = 0) => {
      patchFields({
        [WEAPON_DIALOG_URL_KEYS.weapon]: getWeaponUrlKey(weapon),
        [WEAPON_DIALOG_URL_KEYS.rarity]:
          rarityIndexToParam(weapon.rarityRows, rarityIndex) || undefined,
      });
    },
    [patchFields],
  );

  const syncClose = useCallback(() => {
    patchFields({
      [WEAPON_DIALOG_URL_KEYS.weapon]: undefined,
      [WEAPON_DIALOG_URL_KEYS.rarity]: undefined,
    });
  }, [patchFields]);

  const syncRarity = useCallback(
    (weapon: Weapon, index: number) => {
      patchFields({
        [WEAPON_DIALOG_URL_KEYS.rarity]:
          rarityIndexToParam(weapon.rarityRows, index) || undefined,
      });
    },
    [patchFields],
  );

  const resolveRarityIndex = useCallback(
    (rows: WeaponRarityRow[]) =>
      rarityParamToIndex(rows, urlRarityParam || null),
    [urlRarityParam],
  );

  return {
    urlWeaponKey,
    syncOpen,
    syncClose,
    syncRarity,
    resolveRarityIndex,
  };
}
