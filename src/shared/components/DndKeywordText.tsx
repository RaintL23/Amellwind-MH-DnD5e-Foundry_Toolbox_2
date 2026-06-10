import { DndRichText } from "./DndRichText";

interface DndKeywordTextProps {
  text: string;
  className?: string;
}

/** Highlights common D&D terms in plain or 5etools-marked text. */
export function DndKeywordText({ text, className }: DndKeywordTextProps) {
  return <DndRichText text={text} className={className} highlightKeywords />;
}
