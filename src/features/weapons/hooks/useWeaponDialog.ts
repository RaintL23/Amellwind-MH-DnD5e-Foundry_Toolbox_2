import { useEffect, useMemo, useState } from "react";
import { OptionalFeature, Weapon } from "@/shared/types";
import {
  getOptionalFeaturesMap,
  resolveWeaponBaseFeatures,
} from "../services/optionalfeature.service";
import { getMhItemEffectsMap } from "../services/mh-item-effects.service";
import { buildColumnChains } from "../utils/weapon-feature-chains.utils";

export function useWeaponDialog(weapon: Weapon | null, open: boolean) {
  const [current, setCurrent] = useState(0);
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
    setCurrent(0);
  }, [weapon?.name, open]);

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

  function handlePrev() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  function handleNext() {
    setCurrent((c) => Math.min(total - 1, c + 1));
  }

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
