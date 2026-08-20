import { DndRichText } from "@/shared/components/DndRichText";
import { DescriptionLines } from "@/shared/components/DescriptionLines";
import { splitDisplayTextLines } from "@/shared/utils/fivetools-parser";
import { cn } from "@/shared/utils/cn";
import { RUNE_CATALOG_PHRASE_LINKS } from "../../utils/rune-catalog-links";

interface RuneEffectTextProps {
  text: string;
  className?: string;
}

/** Renders rune effect text, including nested list bullets from the source data. */
export function RuneEffectText({ text, className }: RuneEffectTextProps) {
  const lines = splitDisplayTextLines(text);

  if (lines.length <= 1) {
    return (
      <DndRichText
        text={text}
        className={className}
        phraseLinks={RUNE_CATALOG_PHRASE_LINKS}
      />
    );
  }

  return (
    <DescriptionLines
      lines={lines}
      sizeClass={cn("text-xs leading-relaxed", className)}
      phraseLinks={RUNE_CATALOG_PHRASE_LINKS}
    />
  );
}
