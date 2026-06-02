import { useMemo } from "react";
import { cn } from "@/shared/utils/cn";
import {
  DND_KEYWORD_CLASS,
  splitDndKeywords,
} from "@/shared/utils/dnd-keywords.utils";

interface DndKeywordTextProps {
  text: string;
  className?: string;
}

export function DndKeywordText({ text, className }: DndKeywordTextProps) {
  const segments = useMemo(() => splitDndKeywords(text), [text]);
  const hasKeywords = segments.some((segment) => segment.category != null);

  if (!hasKeywords) {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.category ? (
          <span
            key={index}
            className={cn(DND_KEYWORD_CLASS[segment.category], className)}
          >
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
