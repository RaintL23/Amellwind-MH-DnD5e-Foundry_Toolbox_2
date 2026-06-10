import { useMemo } from "react";
import { cn } from "@/shared/utils/cn";
import {
  type ParseRichTextOptions,
  parseRichText,
  getRichTextSegmentClass,
} from "@/shared/utils/dnd-rich-text.utils";

interface DndRichTextProps extends ParseRichTextOptions {
  text: string;
  className?: string;
}

/**
 * Renders D&D text with 5etools markup formatting and optional keyword highlighting.
 * Central replacement for ad-hoc parsers — use this anywhere game text is shown in the UI.
 */
export function DndRichText({
  text,
  className,
  highlightKeywords = true,
}: DndRichTextProps) {
  const segments = useMemo(
    () => parseRichText(text, { highlightKeywords }),
    [text, highlightKeywords],
  );

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        const styleClass = getRichTextSegmentClass(seg);

        if (seg.kind === "italic") {
          return (
            <em key={i} className={cn(styleClass)}>
              {seg.content}
            </em>
          );
        }
        if (seg.kind === "bold") {
          return (
            <strong key={i} className={cn(styleClass)}>
              {seg.content}
            </strong>
          );
        }
        if (styleClass) {
          return (
            <span key={i} className={cn(styleClass)}>
              {seg.content}
            </span>
          );
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </span>
  );
}
