import { memo } from "react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { getTier } from "@/shared/utils/cr.utils";
import { cn } from "@/shared/utils/cn";

interface BestiaryMobileCardProps {
  creature: BestiaryCreature;
  onSelect: (creature: BestiaryCreature) => void;
}

function CrBadge({ cr }: { cr: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap",
        "border-amber-800/50 bg-amber-950/40 text-amber-400",
      )}
    >
      CR {cr}
    </span>
  );
}

export const BestiaryMobileCard = memo(function BestiaryMobileCard({
  creature,
  onSelect,
}: BestiaryMobileCardProps) {
  const sources = creature.variantSources ?? [creature.source];
  const sourceLabel =
    sources.length <= 1
      ? sources[0]
      : `${sources[0]} +${sources.length - 1}`;
  const typeLabel = creature.type.tags?.length
    ? `${creature.type.type} (${creature.type.tags.join(", ")})`
    : creature.type.type;
  const tier = getTier(creature.cr);

  return (
    <button
      type="button"
      className="flex min-h-14 w-full flex-col gap-1 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/40"
      onClick={() => onSelect(creature)}
    >
      <p className="truncate font-medium text-foreground">{creature.name}</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <CrBadge cr={creature.crDisplay || creature.cr} />
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
          Tier {tier}
        </span>
      </p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        <span className="capitalize">{typeLabel}</span>
        <span aria-hidden="true">·</span>
        <span>{creature.size}</span>
        <span aria-hidden="true">·</span>
        <span title={sources.length > 1 ? sources.join(", ") : undefined}>
          {sourceLabel}
        </span>
      </p>
    </button>
  );
});
