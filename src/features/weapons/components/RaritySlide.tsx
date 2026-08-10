import {
  OptionalFeature,
  WeaponRarityRow,
  RARITY_STYLES,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { ColumnChains } from "@/shared/foundry/weapons";
import { getRaritySlideStatEntries } from "../utils/rarity-slide.utils";
import { RaritySlideHeader } from "./RaritySlideHeader";
import { RaritySlideStats } from "./RaritySlideStats";
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
  const { headerBonuses, otherStats } = getRaritySlideStatEntries(row);

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
        headerBonuses={headerBonuses}
        styleText={style.text}
      />

      <RaritySlideStats entries={otherStats} styleText={style.text} />

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
