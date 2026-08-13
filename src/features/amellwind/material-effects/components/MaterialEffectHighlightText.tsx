import { useMemo } from "react";
import type { MaterialEffectSlot } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
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
    if (!index) return null;

    const candidateNames = findMatchingMaterialEffectNames(parsed, index.all);

    return splitMaterialEffectRefs(parsed, candidateNames, index.byKey, slot);
  }, [parsed, index, slot]);

  if (!index || !segments || segments.every((segment) => !segment.isMaterialEffect)) {
    return <DndRichText text={text} className={className} />;
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
          <DndRichText key={segment.idx} text={segment.text} />
        ),
      )}
    </span>
  );
}
