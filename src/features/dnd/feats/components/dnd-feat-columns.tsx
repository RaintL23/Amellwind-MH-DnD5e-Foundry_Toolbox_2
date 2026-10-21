import { ColumnDef } from "@tanstack/react-table";
import type { DndFeat } from "@/shared/types";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { SourceAbbreviations } from "@/shared/components/SourceAbbreviations";

const BADGE_BASE =
  "inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap";

export function getDndFeatTypeLabel(feat: DndFeat): string | undefined {
  if (feat.isOriginFeat) return "Origin Feat";
  return feat.category
    ? (DND_FEAT_CATEGORY_LABELS[feat.category] ?? feat.category)
    : undefined;
}

export const dndFeatColumns: ColumnDef<DndFeat>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
  },
  {
    id: "type",
    header: "Type",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => {
      const label = getDndFeatTypeLabel(row.original);
      if (!label) return null;
      return row.original.isOriginFeat ? (
        <span
          className={`${BADGE_BASE} border-sky-800/50 bg-sky-950/40 text-sky-300`}
        >
          {label}
        </span>
      ) : (
        <span className={`${BADGE_BASE} border-border/50 text-muted-foreground`}>
          {label}
        </span>
      );
    },
  },
  {
    id: "prerequisites",
    header: "Prerequisites",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.prerequisites.map((p) => (
          <span
            key={p}
            className={`${BADGE_BASE} border-amber-800/50 bg-amber-950/40 text-amber-400`}
          >
            {p}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: "ability",
    header: "Ability",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.abilityIncreases.map((a) => (
          <span
            key={a.label}
            className={`${BADGE_BASE} border-emerald-800/50 bg-emerald-950/40 text-emerald-400`}
          >
            {a.label}
          </span>
        ))}
        {row.original.repeatable && (
          <span
            className={`${BADGE_BASE} border-violet-800/50 bg-violet-950/40 text-violet-400`}
          >
            Repeatable
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <SourceAbbreviations
        source={row.original.source}
        variantSources={row.original.variantSources}
      />
    ),
  },
];
