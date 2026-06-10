import type { Spell, SpellComponents } from "@/shared/types";
import { DescriptionLines } from "@/shared/components/DescriptionLines";
import { DndRichText } from "@/shared/components/DndRichText";
import { cn } from "@/shared/utils/cn";

function formatComponents(components: SpellComponents): string {
  const parts: string[] = [];
  if (components.v) parts.push("V");
  if (components.s) parts.push("S");
  if (components.m) parts.push(`M (${components.m})`);
  return parts.join(", ") || "—";
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[11px] leading-snug">
      <span className="w-[5.5rem] shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-foreground">{value}</span>
    </div>
  );
}

interface SpellExpandedDetailsProps {
  spell: Spell;
  className?: string;
}

export function SpellExpandedDetails({
  spell,
  className,
}: SpellExpandedDetailsProps) {
  return (
    <div
      className={cn("mt-2 space-y-2 border-t border-border/50 pt-2", className)}
    >
      <div className="space-y-1 rounded-md border border-border/40 bg-muted/20 p-2">
        <MetaItem label="Casting time" value={spell.castingTime} />
        <MetaItem label="Range" value={spell.range} />
        <MetaItem
          label="Components"
          value={formatComponents(spell.components)}
        />
        <MetaItem label="Duration" value={spell.duration} />
        <MetaItem
          label="Level"
          value={spell.level === 0 ? "Cantrip" : `${spell.level}º`}
        />
        <MetaItem label="School" value={spell.schoolName} />
        {(spell.isRitual || spell.isConcentration) && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {spell.isRitual && (
              <span className="rounded border border-emerald-800/50 bg-emerald-950/40 px-1.5 py-0 text-[9px] font-medium text-emerald-400">
                Ritual
              </span>
            )}
            {spell.isConcentration && (
              <span className="rounded border border-amber-800/50 bg-amber-950/40 px-1.5 py-0 text-[9px] font-medium text-amber-400">
                Concentration
              </span>
            )}
          </div>
        )}
      </div>

      {spell.description.length > 0 && (
        <DescriptionLines
          lines={spell.description}
          sizeClass="text-[11px]"
          insetAccent="violet"
        />
      )}

      {spell.higherLevel && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-violet-400">
            At higher levels
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <DndRichText text={spell.higherLevel} />
          </p>
        </div>
      )}
    </div>
  );
}
