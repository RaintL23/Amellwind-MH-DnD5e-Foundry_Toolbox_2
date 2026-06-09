import { cn } from "@/shared/utils/cn";
import type { DamageType } from "@/shared/types";
import type { DefenseKind, ProficiencySource, ProficiencySourceType } from "@/shared/types/proficiency.types";
import { formatDamageTypeLabel } from "@/shared/utils/defense-grant.parser";
import {
  badgeStyleForSource,
  SOURCE_LABELS,
} from "../../utils/proficiency-source-styles";

interface BuilderDefensePickerProps {
  grants: Array<{
    kind: "choose";
    from: DamageType[];
    count: number;
    defenseKind: DefenseKind;
    source: ProficiencySource;
  }>;
  chosen: DamageType[];
  onChange: (types: DamageType[]) => void;
  label?: string;
  pickerSourceType: ProficiencySourceType;
}

export function BuilderDefensePicker({
  grants,
  chosen,
  onChange,
  label,
  pickerSourceType,
}: BuilderDefensePickerProps) {
  if (!grants.length) return null;

  const totalCount = grants.reduce((acc, g) => acc + g.count, 0);
  const allowed = [...new Set(grants.flatMap((g) => g.from))].sort((a, b) =>
    formatDamageTypeLabel(a).localeCompare(formatDamageTypeLabel(b)),
  );
  const remainingPicks = Math.max(0, totalCount - chosen.length);
  const canPickMore = remainingPicks > 0;
  const grantSourceName = grants[0]?.source.name ?? "";
  const defenseKind = grants[0]?.defenseKind ?? "resistance";
  const pickerColor = badgeStyleForSource(pickerSourceType);
  const prefix = defenseKind === "immunity" ? "Immunity" : "Resistance";

  function handleToggle(type: DamageType, isChosen: boolean) {
    if (isChosen) {
      onChange(chosen.filter((t) => t !== type));
      return;
    }
    if (canPickMore && !chosen.includes(type)) {
      onChange([...chosen, type]);
    }
  }

  return (
    <div className="mt-2 rounded-md border border-border/50 bg-muted/30 p-2">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label ?? grantSourceName} — {prefix.toLowerCase()} choose {totalCount}
        {remainingPicks > 0 && remainingPicks < totalCount && (
          <span className="normal-case text-muted-foreground/80">
            {" "}
            (pick {remainingPicks} more)
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-1">
        {allowed.map((type) => {
          const isChosen = chosen.includes(type);
          const isDisabled = !isChosen && !canPickMore;

          return (
            <button
              key={type}
              type="button"
              disabled={isDisabled}
              title={
                isChosen ? `Your ${SOURCE_LABELS[pickerSourceType]} choice` : undefined
              }
              onClick={() => handleToggle(type, isChosen)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                isChosen
                  ? pickerColor
                  : !isDisabled &&
                      "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
                !isChosen &&
                  isDisabled &&
                  "cursor-not-allowed border-border/40 text-muted-foreground/40",
              )}
            >
              {formatDamageTypeLabel(type)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BuilderDefenseBadgeList({
  resistances,
  immunities,
  defenseSources,
}: {
  resistances: DamageType[];
  immunities: DamageType[];
  defenseSources: Partial<
    Record<string, Array<{ source: ProficiencySource; defenseKind: DefenseKind }>>
  >;
}) {
  if (!resistances.length && !immunities.length) {
    return (
      <p className="py-2 text-center text-[11px] text-muted-foreground">
        Select a Species to see resistances and immunities.
      </p>
    );
  }

  function renderGroup(types: DamageType[], kind: DefenseKind) {
    return types.map((type) => {
      const entries = (defenseSources[type] ?? []).filter(
        (e) => e.defenseKind === kind,
      );
      const color = entries.length
        ? badgeStyleForSource(entries[0]!.source.type)
        : "border-border text-muted-foreground";
      const tooltip = entries
        .map((e) => `${SOURCE_LABELS[e.source.type]}: ${e.source.name}`)
        .join(", ");

      return (
        <span
          key={`${kind}-${type}`}
          title={tooltip || undefined}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            color,
            kind === "immunity" && "ring-1 ring-rose-500/30",
          )}
        >
          {kind === "immunity" ? "Immune: " : "Resist: "}
          {formatDamageTypeLabel(type)}
        </span>
      );
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {renderGroup(resistances, "resistance")}
      {renderGroup(immunities, "immunity")}
    </div>
  );
}
