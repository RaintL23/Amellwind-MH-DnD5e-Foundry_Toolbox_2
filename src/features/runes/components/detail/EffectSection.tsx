import { useMemo } from "react";
import type { MaterialEffectSlot, ResourceRarity } from "@/shared/types";
import { RESOURCE_RARITY_STYLES } from "@/shared/types";
import type { MaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import { MaterialEffectHighlightText } from "@/features/material-effects/components/MaterialEffectHighlightText";
import { getReferencedMaterialEffectsForText } from "@/features/material-effects/utils/material-effect-highlight.utils";
import { cn } from "@/shared/utils/cn";

interface EffectSectionProps {
  label: string;
  text: string;
  slot: MaterialEffectSlot;
  materialEffectIndex?: MaterialEffectNameIndex | null;
}

function resolveEffectRarityLabel(
  text: string,
  slot: MaterialEffectSlot,
  index: MaterialEffectNameIndex | null | undefined,
): ResourceRarity | "Unknown" {
  if (!index) return "Unknown";

  const refs = getReferencedMaterialEffectsForText(text, slot, index);
  if (refs.length === 0) return "Unknown";

  return refs[0].rarity;
}

export function EffectSection({
  label,
  text,
  slot,
  materialEffectIndex,
}: EffectSectionProps) {
  const rarityLabel = useMemo(
    () => resolveEffectRarityLabel(text, slot, materialEffectIndex),
    [text, slot, materialEffectIndex],
  );

  const rarityStyle =
    rarityLabel === "Unknown"
      ? "bg-muted/40 text-muted-foreground border-border"
      : RESOURCE_RARITY_STYLES[rarityLabel].badge;

  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
        {label}
      </h4>
      <p className="mt-1 mb-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
            rarityStyle,
          )}
        >
          {rarityLabel}
        </span>
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <MaterialEffectHighlightText
          text={text}
          slot={slot}
          index={materialEffectIndex}
        />
      </p>
    </div>
  );
}
