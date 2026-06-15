import { useState } from "react";
import { OptionalFeature, WeaponRarityRow } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { ColumnChains } from "../utils/weapon-feature-chains.utils";
import { resolveMhItemParagraphs } from "../services/mh-item-effects.service";
import { ExpandableFeatureRow } from "./ExpandableFeatureRow";
import { RarityDot } from "./RarityDot";

interface RaritySlideFeatureChainsProps {
  rarityIndex: number;
  rarityRows: WeaponRarityRow[];
  columnChains: ColumnChains[];
  featuresMap: Map<string, OptionalFeature>;
  mhItemEffectsMap: Map<string, string>;
  baseFeatures: OptionalFeature[];
  baseFeatureNameKeys: Set<string>;
  styleText: string;
}

export function RaritySlideFeatureChains({
  rarityIndex,
  rarityRows,
  columnChains,
  featuresMap,
  mhItemEffectsMap,
  baseFeatures,
  baseFeatureNameKeys,
  styleText,
}: RaritySlideFeatureChainsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleFeature(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      const key = name.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const visibleCols = columnChains
    .map(({ label, chains }) => ({
      label,
      chains: chains
        .filter((c) => c.introducedAtIndex <= rarityIndex)
        .map((chain) => ({
          ...chain,
          features: chain.features.filter(
            (f) => !baseFeatureNameKeys.has(f.name.toLowerCase()),
          ),
        }))
        .filter((c) => c.features.length > 0),
    }))
    .filter(({ chains }) => chains.length > 0);

  const hasChainFeatures = visibleCols.some(({ chains }) => chains.length > 0);

  return (
    <>
      {baseFeatures.length > 0 && (
        <div className="border-t border-white/10 pt-2 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Base Features
          </p>
          {baseFeatures.map((feat) => (
            <ExpandableFeatureRow
              key={feat.name}
              name={feat.name}
              paragraphs={feat.paragraphs}
              isExpanded={expanded.has(feat.name.toLowerCase())}
              onToggle={() => toggleFeature(feat.name)}
              leadingIcon={<span className="shrink-0 mt-0.5">★</span>}
              className="text-foreground"
            />
          ))}
        </div>
      )}

      <div className="flex-1">
        {hasChainFeatures ? (
          <div className="space-y-4">
            {visibleCols.map(({ label, chains }) => (
              <div key={label}>
                {visibleCols.length > 1 && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {label}
                  </p>
                )}
                <div className="space-y-2.5">
                  {chains.map((chain) => {
                    const visible = chain.features.filter(
                      (f) => f.rarityIndex <= rarityIndex,
                    );
                    return (
                      <div key={chain.baseName} className="space-y-1">
                        {visible.map((feat, fi) => {
                          const isNew = feat.rarityIndex === rarityIndex;
                          const isUpgrade = fi > 0;
                          const featRarity =
                            rarityRows[feat.rarityIndex]?.rarity ?? "";
                          const feature = featuresMap.get(
                            feat.name.toLowerCase(),
                          );
                          const paragraphs =
                            feature?.paragraphs?.length
                              ? feature.paragraphs
                              : resolveMhItemParagraphs(
                                  feat.name,
                                  mhItemEffectsMap,
                                );

                          return (
                            <ExpandableFeatureRow
                              key={`${feat.name}-${feat.rarityIndex}`}
                              name={feat.name}
                              paragraphs={paragraphs}
                              isExpanded={expanded.has(
                                feat.name.toLowerCase(),
                              )}
                              onToggle={() => toggleFeature(feat.name)}
                              indent={isUpgrade}
                              leadingIcon={
                                <span className="shrink-0 mt-0.5">
                                  {isUpgrade ? "└" : ""}
                                </span>
                              }
                              className={
                                isNew
                                  ? "text-foreground"
                                  : "text-muted-foreground/60"
                              }
                              trailing={
                                <>
                                  <RarityDot rarity={featRarity} />
                                  {isNew && (
                                    <span
                                      className={cn(
                                        "text-[10px] font-bold uppercase tracking-wide shrink-0",
                                        styleText,
                                      )}
                                    >
                                      new
                                    </span>
                                  )}
                                </>
                              }
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : baseFeatures.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No features at this rarity tier.
          </p>
        ) : null}
      </div>
    </>
  );
}
