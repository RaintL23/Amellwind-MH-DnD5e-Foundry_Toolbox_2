import { useMemo } from "react";
import type { MaterialEffectSlot } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { cn } from "@/shared/utils/cn";
import {
  findMatchingMaterialEffectNames,
  splitMaterialEffectRefs,
} from "../utils/material-effect-highlight.utils";
import { useMaterialEffectNameIndex } from "../hooks/useMaterialEffectNames";
import type { MaterialEffectNameIndex } from "../services/material-effect.service";

interface MaterialEffectHighlightTextProps {
  text: string;
  slot: MaterialEffectSlot;
  className?: string;
  index?: MaterialEffectNameIndex | null;
}

const SLOT_HIGHLIGHT_CLASS: Record<MaterialEffectSlot, string> = {
  weapon: "text-orange-400 font-semibold",
  armor: "text-sky-400 font-semibold",
};

export function MaterialEffectHighlightText({
  text,
  slot,
  className,
  index: indexProp,
}: MaterialEffectHighlightTextProps) {
  const loadedIndex = useMaterialEffectNameIndex();
  const index = indexProp ?? loadedIndex;

  const parsed = useMemo(() => parseFiveToolsMarkup(text), [text]);

  const segments = useMemo(() => {
    if (!index) return [{ idx: 0, text: parsed, isMaterialEffect: false as const }];

    const candidateNames = findMatchingMaterialEffectNames(
      parsed,
      index.bySlot[slot],
    );

    return splitMaterialEffectRefs(parsed, candidateNames, index.byKey, slot);
  }, [parsed, index, slot]);

  if (!index || segments.every((segment) => !segment.isMaterialEffect)) {
    return <span className={className}>{parsed}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment) =>
        segment.isMaterialEffect ? (
          <span
            key={segment.idx}
            className={cn(SLOT_HIGHLIGHT_CLASS[slot])}
            title={segment.effect?.effect}
          >
            {segment.text}
          </span>
        ) : (
          <span key={segment.idx}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
