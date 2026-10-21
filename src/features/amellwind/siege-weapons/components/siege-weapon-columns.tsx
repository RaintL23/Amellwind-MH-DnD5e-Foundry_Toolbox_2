import { ColumnDef } from "@tanstack/react-table";
import type { SiegeWeapon } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const siegeWeaponColumns: ColumnDef<SiegeWeapon>[] = [
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
    accessorKey: "objectTypeLabel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <span className="inline-block whitespace-nowrap rounded border border-orange-800/50 bg-orange-950/40 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
        {row.original.objectTypeLabel}
      </span>
    ),
  },
  {
    accessorKey: "sizeLabel",
    header: "Size",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="inline-block whitespace-nowrap rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {row.original.sizeLabel}
      </span>
    ),
  },
  {
    id: "stats",
    header: "AC · HP",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        AC {row.original.acLabel} · HP {row.original.hpLabel}
      </span>
    ),
  },
  {
    accessorKey: "summary",
    header: "Summary",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-md text-xs text-muted-foreground">
        {row.original.summary}
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
