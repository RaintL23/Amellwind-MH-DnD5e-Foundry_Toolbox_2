import { useState, useRef, useMemo } from "react";
import { DndRichText } from "./DndRichText";

type TooltipState = { x: number; y: number; text: string } | null;

function TooltipPopover({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;
  return (
    <div
      className="fixed z-50 max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg pointer-events-none leading-relaxed"
      style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
    >
      {tooltip.text}
    </div>
  );
}

function splitWithRefs(
  text: string,
  names: string[],
): Array<{ isItem: boolean; text: string; idx: number }> {
  if (!names.length) return [{ isItem: false, text, idx: 0 }];

  const sorted = [...names].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  return text
    .split(regex)
    .filter((p) => p.length > 0)
    .map((part, idx) => ({
      isItem: names.some((n) => n.toLowerCase() === part.toLowerCase()),
      text: part,
      idx,
    }));
}

/**
 * Renders a text string with any item name references highlighted and
 * showing a tooltip with the item's description on hover.
 *
 * If no item names are found in the text, renders the text as-is.
 */
export function ItemRefText({
  text,
  itemDescMap,
}: {
  text: string;
  itemDescMap: Record<string, string>;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matchingNames = useMemo(() => {
    const lower = text.toLowerCase();
    return Object.keys(itemDescMap).filter((name) =>
      lower.includes(name.toLowerCase()),
    );
  }, [text, itemDescMap]);

  const segments = useMemo(
    () => splitWithRefs(text, matchingNames),
    [text, matchingNames],
  );

  if (!matchingNames.length) return <DndRichText text={text} />;

  return (
    <>
      <TooltipPopover tooltip={tooltip} />
      {segments.map((seg) => {
        if (!seg.isItem) return <DndRichText key={seg.idx} text={seg.text} />;

        const canonicalKey = Object.keys(itemDescMap).find(
          (n) => n.toLowerCase() === seg.text.toLowerCase(),
        )!;
        const desc = itemDescMap[canonicalKey];

        return (
          <span
            key={seg.idx}
            className="underline decoration-dotted decoration-primary/50 text-primary/90 cursor-help"
            onMouseEnter={(e) => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setTooltip({ x: e.clientX, y: e.clientY, text: desc });
              }, 300);
            }}
            onMouseMove={(e) => {
              if (tooltip) {
                setTooltip((prev) =>
                  prev ? { ...prev, x: e.clientX, y: e.clientY } : prev,
                );
              }
            }}
            onMouseLeave={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setTooltip(null);
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}
