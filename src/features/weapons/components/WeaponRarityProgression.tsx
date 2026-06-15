import { OptionalFeature, Weapon } from "@/shared/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ColumnChains } from "../utils/weapon-feature-chains.utils";
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
          columnChains={columnChains}
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
