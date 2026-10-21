import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";

/** `getRowId` for entities that already carry a stable `id`. */
export function getEntityRowId(row: { id: string }): string {
  return row.id;
}

/** Sortable "Name" column with the default emphasized cell. */
export function createNameColumn<T extends { name: string }>(): ColumnDef<T> {
  return {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
  };
}

/** "Source · p. N" column (hidden below `md`). */
export function createSourcePageColumn<
  T extends { source: string; page?: number },
>(): ColumnDef<T> {
  return {
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
  };
}
