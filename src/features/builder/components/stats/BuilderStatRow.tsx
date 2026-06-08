import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import type { ProficiencySource } from "@/shared/types/proficiency.types";
import {
  dominantSourceType,
  dotStyleForSource,
  formatProficiencyTooltip,
} from "../../utils/proficiency-source-styles";

interface BuilderStatRowProps {
  label: ReactNode;
  value: ReactNode;
  secondary?: ReactNode;
  proficient?: boolean;
  expertise?: boolean;
  advantage?: boolean;
  disadvantage?: boolean;
  /** Sources that grant proficiency (for dot color and tooltip). */
  proficiencySources?: ProficiencySource[];
  /** Tooltip shown on the label area (plain string for native title). */
  sourcesTooltip?: string;
}

export function BuilderStatRow({
  label,
  value,
  secondary,
  proficient,
  expertise,
  advantage,
  disadvantage,
  proficiencySources,
  sourcesTooltip,
}: BuilderStatRowProps) {
  const proficiencyDotStyle =
    proficiencySources?.length
      ? dotStyleForSource(dominantSourceType(proficiencySources))
      : "text-primary";
  const proficiencyTitle = proficiencySources?.length
    ? formatProficiencyTooltip(proficiencySources)
    : "Proficient";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/40 py-1.5 text-[12px] last:border-b-0",
        expertise && "bg-violet-500/5",
        proficient && !expertise && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-muted-foreground",
          (proficient || expertise) && "font-medium text-foreground",
        )}
        title={sourcesTooltip}
      >
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        {advantage && (
          <span
            className="rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
            title="Advantage on this check"
          >
            ADV
          </span>
        )}
        {disadvantage && (
          <span
            className="rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400"
            title="Disadvantage on this check"
          >
            DIS
          </span>
        )}
        {expertise && (
          <span className="text-[9px] font-bold text-violet-500" title="Expertise (double proficiency)">
            2×
          </span>
        )}
        {proficient && !expertise && (
          <span
            className={cn("text-[9px] font-bold", proficiencyDotStyle)}
            title={proficiencyTitle}
          >
            ●
          </span>
        )}
        {secondary && (
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {secondary}
          </span>
        )}
        <span className="min-w-[2.5rem] text-right text-sm font-medium tabular-nums text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}
