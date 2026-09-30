import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { cn } from "@/shared/utils/cn";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";

export function MetaRow({
  label,
  value,
  differs,
}: {
  label: string;
  value: string;
  differs?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-28 sm:shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-sm break-words",
          differs ? "text-amber-300 font-medium" : "text-foreground",
        )}
      >
        {value}
        {differs && (
          <span className="ml-1.5 text-[10px] font-normal text-amber-500/80">
            (varies)
          </span>
        )}
      </span>
    </div>
  );
}

export function LairRegionalSection({ creature }: { creature: BestiaryCreature }) {
  const group = creature.legendaryGroup;
  if (!group) return null;

  return (
    <div className="space-y-4">
      {group.lairActions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-amber-800/50 pb-1 mb-2">
            Lair Actions
          </h3>
          <StatBlockContentView content={group.lairActions} />
        </div>
      )}
      {group.regionalEffects.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-amber-800/50 pb-1 mb-2">
            Regional Effects
          </h3>
          <StatBlockContentView content={group.regionalEffects} />
        </div>
      )}
    </div>
  );
}
