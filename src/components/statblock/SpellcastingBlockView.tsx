import type { SpellcastingBlock } from "@/shared/types/bestiary-creature.types";
import { DndRichText } from "@/shared/components/DndRichText";
import { StatBlockContentView } from "./StatBlockContentView";

export function SpellcastingBlockView({ block }: { block: SpellcastingBlock }) {
  return (
    <div className="space-y-2 mb-3 last:mb-0">
      <StatBlockContentView content={block.header} />
      {block.spellLines.length > 0 && (
        <div className="space-y-1.5 pl-3 border-l border-border/80">
          {block.spellLines.map((line) => (
            <div key={line.label} className="text-sm">
              <span className="font-medium text-foreground">{line.label}:</span>{" "}
              <span className="text-muted-foreground">
                <DndRichText text={line.spells.join(", ")} />
              </span>
            </div>
          ))}
        </div>
      )}
      <StatBlockContentView content={block.footer} />
    </div>
  );
}
