import { Fragment, type ReactNode } from "react";
import type { MaterialEffectSlot } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import { useMaterialEffectLink } from "../context/material-effect-link.context";

const SLOT_CLASS: Record<MaterialEffectSlot, string> = {
  weapon: "text-orange-400",
  armor: "text-sky-400",
};

interface MaterialEffectRefProps {
  name: string;
  slot?: MaterialEffectSlot;
  className?: string;
}

/** Effect name that opens its Material Effect dialog; plain text if not in the catalog. */
export function MaterialEffectRef({
  name,
  slot,
  className,
}: MaterialEffectRefProps) {
  const link = useMaterialEffectLink();
  const effect = link.find(name, slot);

  if (!effect) return <span className={className}>{name}</span>;

  return (
    <button
      type="button"
      onClick={() => link.open(effect)}
      className={cn(
        "rounded-sm text-left font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        SLOT_CLASS[effect.slot],
        className,
      )}
    >
      {name}
    </button>
  );
}

/** `[[Name]]` or `[[Name|armor]]` in the text become effect buttons. */
const TOKEN_RE = /\[\[([^\]|]+)(?:\|(armor|weapon))?\]\]/g;

export function LinkedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > last) {
      nodes.push(<DndRichText key={`t${last}`} text={text.slice(last, start)} />);
    }
    nodes.push(
      <MaterialEffectRef
        key={`e${start}`}
        name={match[1]}
        slot={match[2] as MaterialEffectSlot | undefined}
      />,
    );
    last = start + match[0].length;
  }

  if (last === 0) return <DndRichText text={text} />;
  if (last < text.length) {
    nodes.push(<DndRichText key={`t${last}`} text={text.slice(last)} />);
  }
  return <Fragment>{nodes}</Fragment>;
}
