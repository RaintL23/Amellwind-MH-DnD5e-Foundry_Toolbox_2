import { useMemo } from "react";
import type { MaterialEffectSlot, ResourceRarity } from "@/shared/types";
import { RESOURCE_RARITY_STYLES } from "@/shared/types";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import { MaterialEffectHighlightText } from "@/features/amellwind/material-effects/components/MaterialEffectHighlightText";
import { getMaterialEffectTierForText } from "@/features/amellwind/material-effects/utils/material-effect-highlight.utils";
import {
  UNKNOWN_MATERIAL_EFFECT_TIER,
  type MaterialEffectTierFilter,
} from "@/features/amellwind/material-effects/constants/material-effect.constants";
import { Badge } from "@/components/ui/badge";
import { formatTag, tagVariant } from "../../utils/rune-tag.utils";
import { cn } from "@/shared/utils/cn";
import { splitRuneEffectDisplayLines } from "@/features/amellwind/material-effects/utils/material-effect-highlight.utils";
import { RUNE_CATALOG_PHRASE_LINKS } from "../../utils/rune-catalog-links";

interface EffectSectionProps {
  label: string;
  text: string;
  slot: MaterialEffectSlot;
  tags?: string[];
  materialEffectIndex?: MaterialEffectNameIndex | null;
  /** When true, this side does not match the active list filters. */
  dimmed?: boolean;
}

function resolveEffectRarityLabel(
  text: string,
  slot: MaterialEffectSlot,
  index: MaterialEffectNameIndex | null | undefined,
  tags: string[],
): MaterialEffectTierFilter {
  if (!index) return UNKNOWN_MATERIAL_EFFECT_TIER;
  return getMaterialEffectTierForText(text, slot, index, tags);
}

export function EffectSection({
  label,
  text,
  slot,
  tags = [],
  materialEffectIndex,
  dimmed = false,
}: EffectSectionProps) {
  const rarityLabel = useMemo(
    () => resolveEffectRarityLabel(text, slot, materialEffectIndex, tags),
    [text, slot, materialEffectIndex, tags],
  );

  const rarityStyle =
    rarityLabel === UNKNOWN_MATERIAL_EFFECT_TIER
      ? "bg-muted/40 text-muted-foreground border-border"
      : RESOURCE_RARITY_STYLES[rarityLabel as ResourceRarity].badge;

  const lines = useMemo(
    () => splitRuneEffectDisplayLines(text, materialEffectIndex?.all),
    [text, materialEffectIndex],
  );

  return (
    <div
      className={cn(
        "mt-4 transition-opacity",
        dimmed && "opacity-40 pointer-events-none select-none",
      )}
      aria-disabled={dimmed || undefined}
      title={
        dimmed
          ? "This effect does not match the active list filters"
          : undefined
      }
    >
      <h4
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          dimmed ? "text-muted-foreground" : "text-amber-400",
        )}
      >
        {label}
        {dimmed && (
          <span className="ml-2 font-normal normal-case tracking-normal text-[10px] text-muted-foreground">
            (filtered out)
          </span>
        )}
      </h4>
      <div className="mt-1 mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
            rarityStyle,
          )}
        >
          {rarityLabel}
        </span>
        {tags.map((tag) => (
          <Badge key={tag} variant={tagVariant(tag)} className="rounded-md text-[11px]">
            {formatTag(tag)}
          </Badge>
        ))}
      </div>
      <div className="space-y-1.5 text-sm text-muted-foreground leading-relaxed">
        {lines.map((line, index) => (
          <p
            key={`${label}-line-${index}`}
            className={cn(line.startsWith("•") && "pl-3")}
          >
            <MaterialEffectHighlightText
              text={line.startsWith("•") ? line.replace(/^•\s*/, "") : line}
              slot={slot}
              index={materialEffectIndex}
              phraseLinks={RUNE_CATALOG_PHRASE_LINKS}
            />
          </p>
        ))}
      </div>
    </div>
  );
}
