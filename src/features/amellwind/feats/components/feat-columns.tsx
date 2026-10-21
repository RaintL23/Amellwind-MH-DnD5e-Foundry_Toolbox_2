import { ColumnDef } from "@tanstack/react-table";
import type { Feat } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

const BADGE_BASE =
  "inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap";

export const featColumns: ColumnDef<Feat>[] = [
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
    accessorKey: "summary",
    header: "Summary",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-md text-xs text-muted-foreground">
        {row.original.paragraphs[0] ??
          row.original.sections[0]?.paragraphs[0] ??
          row.original.summary}
      </p>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {row.original.source}
        {row.original.page !== undefined ? ` · p. ${row.original.page}` : ""}
      </span>
    ),
  },
];
