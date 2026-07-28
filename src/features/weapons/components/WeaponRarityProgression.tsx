import { useMemo } from "react";
import { OptionalFeature, Weapon } from "@/shared/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { WeaponForgeFeatureDef } from "@/features/weapon-forge/types/weapon-forge.types";
import {
  buildColumnChains,
  ColumnChains,
  type FeatureUpgradeLink,
} from "../utils/weapon-feature-chains.utils";
import { RaritySlide } from "./RaritySlide";
import { RarityDots } from "./RarityDots";

interface WeaponRarityProgressionProps {
  weapon: Weapon;
  current: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  columnChains: ColumnChains[];
  featuresMap: Map<string, OptionalFeature>;
  mhItemEffectsMap: Map<string, string>;
  baseFeatures: OptionalFeature[];
  baseFeatureNameKeys: Set<string>;
}

function toUpgradeLinks(
  customFeatures: WeaponForgeFeatureDef[] | undefined,
): FeatureUpgradeLink[] | undefined {
  if (!customFeatures?.length) return undefined;
  return customFeatures
    .filter((f) => f.name.trim())
    .map((f) => ({
      id: f.id,
      name: f.name,
      upgradesFromId: f.upgradesFromId,
    }));
}

function hasExplicitUpgradeLinks(
  links: FeatureUpgradeLink[] | undefined,
): boolean {
  return Boolean(links?.some((link) => link.upgradesFromId));
}

export function WeaponRarityProgression({
  weapon,
  current,
  onSelect,
  onPrev,
  onNext,
  columnChains,
  featuresMap,
  mhItemEffectsMap,
  baseFeatures,
  baseFeatureNameKeys,
}: WeaponRarityProgressionProps) {
  const total = weapon.rarityRows.length;

  const resolvedColumnChains = useMemo(() => {
    const customFeatures = (weapon as { customFeatures?: WeaponForgeFeatureDef[] })
      .customFeatures;
    const upgradeLinks = toUpgradeLinks(customFeatures);

    if (hasExplicitUpgradeLinks(upgradeLinks)) {
      return buildColumnChains(weapon.rarityRows, { upgradeLinks });
    }

    return columnChains;
  }, [weapon, columnChains]);

  if (total === 0) return null;

  return (
    <>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Rarity Progression
      </h4>
      <div className="relative px-10">
        <button
          onClick={onPrev}
          disabled={current === 0}
          aria-label="Previous rarity"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-accent disabled:opacity-30 disabled:pointer-events-none z-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <RaritySlide
          key={current}
          row={weapon.rarityRows[current]}
          rarityIndex={current}
          rarityRows={weapon.rarityRows}
          columnChains={resolvedColumnChains}
          featuresMap={featuresMap}
          mhItemEffectsMap={mhItemEffectsMap}
          baseFeatures={baseFeatures}
          baseFeatureNameKeys={baseFeatureNameKeys}
        />

        <button
          onClick={onNext}
          disabled={current === total - 1}
          aria-label="Next rarity"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-accent disabled:opacity-30 disabled:pointer-events-none z-10"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <RarityDots
        count={total}
        current={current}
        onSelect={onSelect}
        rows={weapon.rarityRows}
      />
    </>
  );
}
