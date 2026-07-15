import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Weapon } from "@/shared/types";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import { getOptionalFeaturesMap } from "@/features/weapons/services/optionalfeature.service";
import {
  createFeatureDef,
  emptyFormValues,
  weaponToFormValues,
  type CustomWeapon,
  type WeaponForgeFeatureDef,
  type WeaponForgeFormValues,
} from "../types/weapon-forge.types";
import {
  formValuesToWeapon,
  mergeCopiedRarities,
  toCustomWeapon,
} from "../mappers/weapon-forge.mapper";
import { getFeaturesColumnNames } from "../utils/weapon-forge-features.utils";
import {
  getUserWeapons,
  saveUserWeapon,
} from "../services/weapon-forge.service";

export function useWeaponForgeForm() {
  const navigate = useNavigate();
  const { weaponId: weaponIdParam } = useParams<{ weaponId?: string }>();
  const weaponId = weaponIdParam ? decodeURIComponent(weaponIdParam) : undefined;
  const isEdit = Boolean(weaponId);

  const [values, setValues] = useState<WeaponForgeFormValues>(emptyFormValues());
  const [existing, setExisting] = useState<CustomWeapon | null>(null);
  const [amellwindWeapons, setAmellwindWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);

      try {
        const amellwind = await getAllWeapons();
        if (cancelled) return;
        setAmellwindWeapons(amellwind);

        if (!weaponId) {
          setExisting(null);
          setValues(emptyFormValues());
          return;
        }

        const found = getUserWeapons().find((w) => w.id === weaponId) ?? null;
        if (!found) {
          setExisting(null);
          setNotFound(true);
          return;
        }

        setExisting(found);
        setValues(weaponToFormValues(found));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [weaponId]);

  const patch = useCallback(<K extends keyof WeaponForgeFormValues>(
    key: K,
    value: WeaponForgeFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleChangeRows = useCallback(
    (rows: WeaponForgeFormValues["rarityRows"]) => patch("rarityRows", rows),
    [patch],
  );

  const handleChangeFeatures = useCallback(
    (features: WeaponForgeFormValues["customFeatures"]) =>
      patch("customFeatures", features),
    [patch],
  );

  const applyBase = useCallback(
    (weapon: Weapon, rarities: string[] | "all") => {
      const baseValues = weaponToFormValues(weapon);
      baseValues.rarityRows = mergeCopiedRarities(weapon, rarities);
      setValues((prev) => {
        if (prev.name.trim()) baseValues.name = prev.name;
        return baseValues;
      });

      void getOptionalFeaturesMap().then((map) => {
        const defs: WeaponForgeFeatureDef[] = [];
        const seen = new Set<string>();

        for (const row of baseValues.rarityRows) {
          for (const name of getFeaturesColumnNames(row)) {
            const key = name.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            const opt = map.get(key);
            defs.push(
              createFeatureDef({
                name,
                description: opt?.paragraphs.join("\n\n") ?? "",
              }),
            );
          }
        }

        for (const name of weapon.baseFeatureNames) {
          const key = name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          const opt = map.get(key);
          defs.push(
            createFeatureDef({
              name,
              description: opt?.paragraphs.join("\n\n") ?? "",
            }),
          );
        }

        setValues((prev) => ({ ...prev, customFeatures: defs }));
      });
    },
    [],
  );

  const goBack = useCallback(() => {
    navigate("/weapon-forge");
  }, [navigate]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const current = valuesRef.current;
      if (!current.name.trim()) return;

      const base = formValuesToWeapon(current);
      const weapon = toCustomWeapon(base, {
        id: existing?.id,
        isCustom: true,
        createdAt: existing?.createdAt,
        customFeatures: current.customFeatures,
      });
      saveUserWeapon(weapon);
      navigate("/weapon-forge");
    },
    [existing, navigate],
  );

  return {
    isEdit,
    values,
    amellwindWeapons,
    loading,
    notFound,
    patch,
    handleChangeRows,
    handleChangeFeatures,
    applyBase,
    goBack,
    handleSubmit,
  };
}
