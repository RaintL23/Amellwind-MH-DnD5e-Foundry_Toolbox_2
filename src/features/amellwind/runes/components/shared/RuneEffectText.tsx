import { DndRichText } from "@/shared/components/DndRichText";
import { DescriptionLines } from "@/shared/components/DescriptionLines";
import { splitDisplayTextLines } from "@/shared/utils/fivetools-parser";
import { cn } from "@/shared/utils/cn";

interface RuneEffectTextProps {
  text: string;
  className?: string;
}

/** Renders rune effect text, including nested list bullets from the source data. */
export function RuneEffectText({ text, className }: RuneEffectTextProps) {
  const lines = splitDisplayTextLines(text);

  if (lines.length <= 1) {
    return <DndRichText text={text} className={className} />;
  }

  return (
    <DescriptionLines
      lines={lines}
      sizeClass={cn("text-xs leading-relaxed", className)}
    />
  );
}
