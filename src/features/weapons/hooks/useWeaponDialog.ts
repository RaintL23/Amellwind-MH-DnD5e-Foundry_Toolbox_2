import { useCallback, useEffect, useMemo, useState } from "react";
import { OptionalFeature, Weapon, isBaseRarity } from "@/shared/types";
import {
  getOptionalFeaturesMap,
  resolveWeaponBaseFeatures,
} from "../services/optionalfeature.service";
import { getMhItemEffectsMap } from "../services/mh-item-effects.service";
import { buildColumnChains } from "../utils/weapon-feature-chains.utils";
import { weaponWithDisplayRarityRows } from "../utils/weapon-base-rarity.utils";

interface UseWeaponDialogOptions {
  initialRarityIndex?: number;
  /** Preferred over index when set (URL rarity label). */
  initialRarity?: string | null;
  /** Called with the active rarity label (e.g. "Base", "Common"). */
  onRarityChange?: (rarity: string) => void;
  /** Extra optional features (e.g. forge customFeatures) merged over the catalog. */
  extraFeaturesMap?: Map<string, OptionalFeature>;
  /**
   * When false, do not pull Amellwind/catalog optional features by weapon-name
   * prerequisite (forge/RaintDM JSON is the source of truth). Default true.
   */
  includePrerequisiteMatches?: boolean;
}

export function useWeaponDialog(
  weapon: Weapon | null,
  open: boolean,
  options: UseWeaponDialogOptions = {},
) {
  const {
    initialRarityIndex = 0,
    initialRarity = null,
    onRarityChange,
    extraFeaturesMap,
    includePrerequisiteMatches = true,
  } = options;
  const [current, setCurrentState] = useState(0);
  const [catalogFeaturesMap, setCatalogFeaturesMap] = useState<
    Map<string, OptionalFeature>
  >(new Map());
  const [mhItemEffectsMap, setMhItemEffectsMap] = useState<
    Map<string, string>
  >(new Map());

  useEffect(() => {
    getOptionalFeaturesMap().then(setCatalogFeaturesMap);
    getMhItemEffectsMap().then(setMhItemEffectsMap);
  }, []);

  const featuresMap = useMemo(() => {
    if (!extraFeaturesMap || extraFeaturesMap.size === 0) {
      return catalogFeaturesMap;
    }
    const merged = new Map(catalogFeaturesMap);
    for (const [key, feat] of extraFeaturesMap) {
      merged.set(key, feat);
    }
    return merged;
  }, [catalogFeaturesMap, extraFeaturesMap]);

  const resolvedBaseFeatures = useMemo(() => {
    if (!weapon || featuresMap.size === 0) return [];
    return resolveWeaponBaseFeatures(weapon, featuresMap, {
      includePrerequisiteMatches,
    });
  }, [weapon, featuresMap, includePrerequisiteMatches]);

  const displayWeapon = useMemo(() => {
    if (!weapon) return null;
    return weaponWithDisplayRarityRows(weapon, resolvedBaseFeatures);
  }, [weapon, resolvedBaseFeatures]);

  useEffect(() => {
    if (!open || !weapon || !displayWeapon) return;
    const label =
      initialRarity?.trim() ||
      weapon.rarityRows[initialRarityIndex]?.rarity ||
      null;
    if (label) {
      const idx = displayWeapon.rarityRows.findIndex(
        (row) => row.rarity.toLowerCase() === label.toLowerCase(),
      );
      setCurrentState(idx >= 0 ? idx : 0);
      return;
    }
    setCurrentState(0);
  }, [weapon, displayWeapon, open, initialRarityIndex, initialRarity]);

  const setCurrent = useCallback(
    (value: number | ((prev: number) => number)) => {
      setCurrentState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        const rarity = displayWeapon?.rarityRows[next]?.rarity;
        if (rarity) onRarityChange?.(rarity);
        return next;
      });
    },
    [onRarityChange, displayWeapon],
  );

  const total = displayWeapon?.rarityRows.length ?? 0;

  const columnChains = useMemo(
    () => (displayWeapon ? buildColumnChains(displayWeapon.rarityRows) : []),
    [displayWeapon],
  );

  // Base features live on the Base rarity tier when present; hide the legacy section.
  const baseFeatures = useMemo(() => {
    if (!displayWeapon) return [];
    if (displayWeapon.rarityRows.some((row) => isBaseRarity(row.rarity))) {
      return [];
    }
    return resolvedBaseFeatures;
  }, [displayWeapon, resolvedBaseFeatures]);

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
    displayWeapon,
    featuresMap,
    mhItemEffectsMap,
    columnChains,
    baseFeatures,
    baseFeatureNameKeys,
    handlePrev,
    handleNext,
  };
}
