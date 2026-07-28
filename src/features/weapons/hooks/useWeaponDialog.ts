import { useCallback, useEffect, useMemo, useState } from "react";
import { OptionalFeature, Weapon } from "@/shared/types";
import {
  getOptionalFeaturesMap,
  resolveWeaponBaseFeatures,
} from "../services/optionalfeature.service";
import { getMhItemEffectsMap } from "../services/mh-item-effects.service";
import { buildColumnChains } from "../utils/weapon-feature-chains.utils";

interface UseWeaponDialogOptions {
  initialRarityIndex?: number;
  onRarityChange?: (index: number) => void;
}

export function useWeaponDialog(
  weapon: Weapon | null,
  open: boolean,
  options: UseWeaponDialogOptions = {},
) {
  const { initialRarityIndex = 0, onRarityChange } = options;
  const [current, setCurrentState] = useState(0);
  const [featuresMap, setFeaturesMap] = useState<Map<string, OptionalFeature>>(
    new Map(),
  );
  const [mhItemEffectsMap, setMhItemEffectsMap] = useState<
    Map<string, string>
  >(new Map());

  useEffect(() => {
    getOptionalFeaturesMap().then(setFeaturesMap);
    getMhItemEffectsMap().then(setMhItemEffectsMap);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCurrentState(initialRarityIndex);
  }, [weapon?.name, weapon?.id, open, initialRarityIndex]);

  const setCurrent = useCallback(
    (value: number | ((prev: number) => number)) => {
      setCurrentState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        onRarityChange?.(next);
        return next;
      });
    },
    [onRarityChange],
  );

  const total = weapon?.rarityRows.length ?? 0;

  const columnChains = useMemo(
    () => (weapon ? buildColumnChains(weapon.rarityRows) : []),
    [weapon],
  );

  const baseFeatures = useMemo(() => {
    if (!weapon || featuresMap.size === 0) return [];
    return resolveWeaponBaseFeatures(weapon, featuresMap);
  }, [weapon, featuresMap]);

  const baseFeatureNameKeys = useMemo(
    () => new Set(baseFeatures.map((f) => f.name.toLowerCase())),
    [baseFeatures],
  );

  const handlePrev = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1));
  }, [setCurrent]);

  const handleNext = useCallback(() => {
    setCurrent((c) => Math.min(total - 1, c + 1));
  }, [setCurrent, total]);

  return {
    current,
    setCurrent,
    total,
    featuresMap,
    mhItemEffectsMap,
    columnChains,
    baseFeatures,
    baseFeatureNameKeys,
    handlePrev,
    handleNext,
  };
}
