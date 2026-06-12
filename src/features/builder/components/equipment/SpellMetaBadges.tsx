import type { Spell } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface SpellMetaBadgesProps {
  spell: Pick<Spell, "isConcentration" | "isRitual" | "range">;
  className?: string;
  showRange?: boolean;
}

export function SpellMetaBadges({
  spell,
  className,
  showRange = true,
}: SpellMetaBadgesProps) {
  const hasBadges = spell.isConcentration || spell.isRitual || (showRange && spell.range);

  if (!hasBadges) return null;

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-0.5", className)}>
      {spell.isConcentration && (
        <span
          title="Concentration"
          className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-amber-700/50 bg-amber-950/50 px-0.5 text-[9px] font-bold text-amber-300"
        >
          C
        </span>
      )}
      {spell.isRitual && (
        <span
          title="Ritual"
          className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-sky-700/50 bg-sky-950/50 px-0.5 text-[9px] font-bold text-sky-300"
        >
          R
        </span>
      )}
      {showRange && spell.range && (
        <span
          title={`Range: ${spell.range}`}
          className="max-w-[5rem] truncate rounded border border-border/50 bg-muted/40 px-1 py-0 text-[9px] text-muted-foreground"
        >
          {spell.range}
        </span>
      )}
    </span>
  );
}

export function formatSpellNameWithMeta(
  name: string,
  spell: Pick<Spell, "isConcentration" | "isRitual" | "range"> | undefined,
): string {
  if (!spell) return name;
  const markers: string[] = [];
  if (spell.isConcentration) markers.push("C");
  if (spell.isRitual) markers.push("R");
  const markerSuffix = markers.length > 0 ? ` [${markers.join("")}]` : "";
  const rangeSuffix = spell.range ? ` (${spell.range})` : "";
  return `${name}${markerSuffix}${rangeSuffix}`;
}
