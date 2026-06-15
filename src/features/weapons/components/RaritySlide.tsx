import {
  OptionalFeature,
  WeaponRarityRow,
  RARITY_STYLES,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { ColumnChains } from "../utils/weapon-feature-chains.utils";
import {
  getRaritySlideStatEntries,
  getRaritySlideUnlockSections,
} from "../utils/rarity-slide.utils";
import { RaritySlideHeader } from "./RaritySlideHeader";
import { RaritySlideStats } from "./RaritySlideStats";
import { RaritySlideUnlockSection } from "./RaritySlideUnlockSection";
import { RaritySlideFeatureChains } from "./RaritySlideFeatureChains";

interface RaritySlideProps {
  row: WeaponRarityRow;
  rarityIndex: number;
  rarityRows: WeaponRarityRow[];
  columnChains: ColumnChains[];
  featuresMap: Map<string, OptionalFeature>;
  mhItemEffectsMap: Map<string, string>;
  baseFeatures: OptionalFeature[];
  baseFeatureNameKeys: Set<string>;
}

export function RaritySlide({
  row,
  rarityIndex,
  rarityRows,
  columnChains,
  featuresMap,
  mhItemEffectsMap,
  baseFeatures,
  baseFeatureNameKeys,
}: RaritySlideProps) {
  const style = RARITY_STYLES[row.rarity] ?? RARITY_STYLES["Common"];
  const { bonus, otherStats } = getRaritySlideStatEntries(row);
  const unlockSections = getRaritySlideUnlockSections(rarityRows, rarityIndex);

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br p-5 flex flex-col gap-3",
        style.border,
        style.bg,
      )}
    >
      <RaritySlideHeader
        row={row}
        attackBonus={bonus}
        styleText={style.text}
      />

      <RaritySlideStats entries={otherStats} styleText={style.text} />

      <RaritySlideUnlockSection
        sections={unlockSections}
        rarityRows={rarityRows}
        rarityIndex={rarityIndex}
        styleText={style.text}
        mhItemEffectsMap={mhItemEffectsMap}
      />

      <RaritySlideFeatureChains
        rarityIndex={rarityIndex}
        rarityRows={rarityRows}
        columnChains={columnChains}
        featuresMap={featuresMap}
        mhItemEffectsMap={mhItemEffectsMap}
        baseFeatures={baseFeatures}
        baseFeatureNameKeys={baseFeatureNameKeys}
        styleText={style.text}
      />
    </div>
  );
}
