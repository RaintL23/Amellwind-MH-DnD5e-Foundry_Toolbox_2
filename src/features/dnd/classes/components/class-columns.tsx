import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Class } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { getCasterLabel } from "../mappers/class.mapper";

const classGlobalFilter: FilterFn<Class> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const cls = row.original;
  if (cls.searchText?.includes(q)) return true;
  return (
    cls.name.toLowerCase().includes(q) ||
    cls.summary.toLowerCase().includes(q) ||
    cls.hitDie.toLowerCase().includes(q) ||
    getCasterLabel(cls.casterProgression).toLowerCase().includes(q) ||
    cls.subclasses.some((s) => s.name.toLowerCase().includes(q)) ||
    (cls.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false)
  );
};

const editionFilter: FilterFn<Class> = (row, _columnId, filterValue) => {
  if (!filterValue) return true;
  return row.original.edition === filterValue;
};

const casterFilter: FilterFn<Class> = (row, _columnId, filterValue) => {
  if (!filterValue) return true;
  const progression = row.original.casterProgression ?? "none";
  return progression === filterValue;
};

const sourceFilter: FilterFn<Class> = (row, _columnId, filterValue) => {
  if (!filterValue) return true;
  const selected = filterValue as string[];
  if (!Array.isArray(selected) || selected.length === 0) return false;
  const sources = row.original.variantSources ?? [row.original.source];
  return sources.some((source) => selected.includes(source));
};

export { classGlobalFilter };

export const classColumns: ColumnDef<Class>[] = [
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
    accessorKey: "hitDie",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hit Die" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.hitDie}</span>
    ),
  },
  {
    id: "casterProgression",
    accessorFn: (row) => getCasterLabel(row.casterProgression),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Spellcasting" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {getCasterLabel(row.original.casterProgression)}
      </span>
    ),
    filterFn: casterFilter,
  },
  {
    id: "subclassCount",
    accessorFn: (row) => row.subclasses.length,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subclasses" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.subclasses.length}</span>
    ),
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-xs">
        {row.original.source}
      </span>
    ),
    filterFn: sourceFilter,
  },
  {
    id: "variants",
    accessorFn: (row) => row.variantCount ?? 1,
    header: "Variants",
    cell: ({ row }) => {
      const count = row.original.variantCount ?? 1;
      if (count <= 1) return null;
      return (
        <span className="rounded-full bg-violet-950/50 border border-violet-800/40 px-2 py-0.5 text-[10px] font-medium text-violet-300">
          {count} sources
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "edition",
    header: "Edition",
    cell: ({ row }) => row.original.edition ?? "—",
    filterFn: editionFilter,
  },
];
