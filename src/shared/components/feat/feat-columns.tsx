import type { ColumnDef } from "@tanstack/react-table";
import type { Feat } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

/** Small outlined tag used in feat table cells (MH and D&D 5e). */
export const FEAT_TAG_BASE =
  "inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap";

export function createFeatPrerequisitesColumn<T extends Feat>(): ColumnDef<T> {
  return {
    id: "prerequisites",
    header: "Prerequisites",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.prerequisites.map((p) => (
          <span
            key={p}
            className={cn(
              FEAT_TAG_BASE,
              "border-amber-800/50 bg-amber-950/40 text-amber-400",
            )}
          >
            {p}
          </span>
        ))}
      </div>
    ),
  };
}

/** Ability increases plus the "Repeatable" tag. */
export function createFeatAbilityColumn<T extends Feat>(): ColumnDef<T> {
  return {
    id: "ability",
    header: "Ability",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.abilityIncreases.map((a) => (
          <span
            key={a.label}
            className={cn(
              FEAT_TAG_BASE,
              "border-emerald-800/50 bg-emerald-950/40 text-emerald-400",
            )}
          >
            {a.label}
          </span>
        ))}
        {row.original.repeatable && (
          <span
            className={cn(
              FEAT_TAG_BASE,
              "border-violet-800/50 bg-violet-950/40 text-violet-400",
            )}
          >
            Repeatable
          </span>
        )}
      </div>
    ),
  };
}
