import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/utils/cn";
import {
  type ParseRichTextOptions,
  type RichTextPhraseLink,
  parseRichText,
  getRichTextSegmentClass,
} from "@/shared/utils/dnd-rich-text.utils";

interface DndRichTextProps extends ParseRichTextOptions {
  text: string;
  className?: string;
  /** Fired when a phraseLink segment is activated. */
  onPhraseClick?: (phraseId: string) => void;
}

/**
 * Renders D&D text with 5etools markup formatting and optional keyword highlighting.
 * Central replacement for ad-hoc parsers — use this anywhere game text is shown in the UI.
 */
export function DndRichText({
  text,
  className,
  highlightKeywords = true,
  phraseLinks,
  onPhraseClick,
}: DndRichTextProps) {
  const segments = useMemo(
    () => parseRichText(text, { highlightKeywords, phraseLinks }),
    [text, highlightKeywords, phraseLinks],
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
        if (seg.kind === "entityLink") {
          return (
            <Link
              key={i}
              to={seg.href}
              onClick={(event) => event.stopPropagation()}
              className={cn(styleClass)}
            >
              {seg.content}
            </Link>
          );
        }
        if (seg.kind === "phraseLink") {
          if (seg.href) {
            return (
              <Link
                key={i}
                to={seg.href}
                onClick={(event) => event.stopPropagation()}
                className={cn(styleClass)}
              >
                {seg.content}
              </Link>
            );
          }
          return (
            <button
              key={i}
              type="button"
              className={cn(
                "inline p-0 m-0 border-0 bg-transparent align-baseline text-inherit",
                styleClass,
              )}
              onClick={() => onPhraseClick?.(seg.phraseId)}
            >
              {seg.content}
            </button>
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

export type { RichTextPhraseLink };
