import { useCallback, useEffect, useMemo, useState } from "react";
import type { Weapon } from "@/shared/types";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import type { CustomWeapon } from "../types/weapon-forge.types";
import {
  deleteUserWeapon,
  exportAllUserWeaponsJson,
  exportWeaponJson,
  getCuratedWeapons,
  getUserWeapons,
  importUserWeapons,
  saveUserWeapon,
} from "../services/weapon-forge.service";
import {
  formValuesToWeapon,
  toCustomWeapon,
} from "../mappers/weapon-forge.mapper";
import type { WeaponForgeFormValues } from "../types/weapon-forge.types";

export function useWeaponForge() {
  const [curated, setCurated] = useState<CustomWeapon[]>([]);
  const [userWeapons, setUserWeapons] = useState<CustomWeapon[]>([]);
  const [amellwindWeapons, setAmellwindWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [curatedList, amellwind] = await Promise.all([
        getCuratedWeapons(),
        getAllWeapons(),
      ]);
      setCurated(curatedList);
      setUserWeapons(getUserWeapons());
      setAmellwindWeapons(amellwind);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const allForgeWeapons = useMemo(
    () => [...curated, ...userWeapons],
    [curated, userWeapons],
  );

  const saveFromForm = useCallback(
    (values: WeaponForgeFormValues, existing?: CustomWeapon) => {
      const base = formValuesToWeapon(values);
      const weapon = toCustomWeapon(base, {
        id: existing?.id,
        isCustom: true,
        createdAt: existing?.createdAt,
        customFeatures: values.customFeatures,
      });
      const next = saveUserWeapon(weapon);
      setUserWeapons(next);
      return weapon;
    },
    [],
  );

  const removeWeapon = useCallback((id: string) => {
    setUserWeapons(deleteUserWeapon(id));
    setCompareSelection((prev) => prev.filter((x) => x !== id));
  }, []);

  const importFromJson = useCallback((data: unknown) => {
    const next = importUserWeapons(data);
    setUserWeapons(next);
    return next;
  }, []);

  const exportOne = useCallback((weapon: CustomWeapon) => {
    exportWeaponJson(weapon);
  }, []);

  const exportAll = useCallback(() => {
    exportAllUserWeaponsJson(userWeapons);
  }, [userWeapons]);

  const toggleCompare = useCallback((id: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareSelection([]);
  }, []);

  const resolveCompareWeapons = useCallback((): Array<
    CustomWeapon | Weapon
  > => {
    const forgeById = new Map(allForgeWeapons.map((w) => [w.id, w]));
    const amellwindByKey = new Map(
      amellwindWeapons.map((w) => [`aw:${w.name}`, w]),
    );

    return compareSelection
      .map((key) => forgeById.get(key) ?? amellwindByKey.get(key))
      .filter((w): w is CustomWeapon | Weapon => w != null);
  }, [allForgeWeapons, amellwindWeapons, compareSelection]);

  return {
    curated,
    userWeapons,
    amellwindWeapons,
    allForgeWeapons,
    loading,
    refresh,
    saveFromForm,
    removeWeapon,
    importFromJson,
    exportOne,
    exportAll,
    compareSelection,
    toggleCompare,
    clearCompare,
    resolveCompareWeapons,
  };
}
