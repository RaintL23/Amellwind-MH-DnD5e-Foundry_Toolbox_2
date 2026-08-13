import { ColumnDef, FilterFn } from "@tanstack/react-table";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { cn } from "@/shared/utils/cn";

export const bestiaryGlobalFilter: FilterFn<BestiaryCreature> = (
  row,
  _columnId,
  filterValue,
) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const c = row.original;
  if (c.searchText?.includes(q)) return true;
  return (
    c.name.toLowerCase().includes(q) ||
    c.cr.toLowerCase().includes(q) ||
    c.size.toLowerCase().includes(q) ||
    c.type.type.toLowerCase().includes(q) ||
    (c.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false)
  );
};

const environmentFilter: FilterFn<BestiaryCreature> = (row, _columnId, filterValue) => {
  if (!filterValue) return true;
  return (row.original.environment ?? []).includes(String(filterValue));
};

function CrBadge({ cr }: { cr: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap",
        "border-amber-800/50 bg-amber-950/40 text-amber-400",
      )}
    >
      {cr}
    </span>
  );
}

export const bestiaryColumns: ColumnDef<BestiaryCreature>[] = [
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
    accessorKey: "cr",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CR" />
    ),
    cell: ({ row }) => <CrBadge cr={row.original.crDisplay || row.original.cr} />,
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.cr === String(value);
    },
    sortingFn: (a, b) => {
      const parse = (cr: string) => {
        if (cr.includes("/")) {
          const [n, d] = cr.split("/").map(Number);
          return n / d;
        }
        return Number(cr) || 0;
      };
      return parse(a.original.cr) - parse(b.original.cr);
    },
  },
  {
    accessorKey: "size",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.getValue("size")}
      </span>
    ),
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.size === String(value);
    },
  },
  {
    id: "creatureType",
    accessorFn: (row) => row.type.type,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs capitalize whitespace-nowrap">
        {row.original.type.type}
        {row.original.type.tags?.length
          ? ` (${row.original.type.tags.join(", ")})`
          : ""}
      </span>
    ),
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.type.type === String(value);
    },
  },
  {
    accessorKey: "environment",
    header: () => null,
    cell: () => null,
    enableSorting: false,
    filterFn: environmentFilter,
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      const c = row.original;
      const sources = c.variantSources ?? [c.source];
      const label =
        sources.length <= 2
          ? sources.join(", ")
          : `${sources[0]} +${sources.length - 1}`;
      return (
        <span
          className="text-muted-foreground text-xs whitespace-nowrap"
          title={sources.length > 1 ? sources.join(", ") : undefined}
        >
          {label}
        </span>
      );
    },
    filterFn: (row, _id, value) => {
      if (!value) return true;
      const sources = row.original.variantSources ?? [row.original.source];
      return sources.includes(String(value));
    },
  },
];

export const CR_FILTER_OPTIONS = [
  { value: "", label: "All CR" },
  { value: "0", label: "0" },
  { value: "1/8", label: "1/8" },
  { value: "1/4", label: "1/4" },
  { value: "1/2", label: "1/2" },
  ...Array.from({ length: 30 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  })),
];

export const SIZE_FILTER_OPTIONS = [
  { value: "", label: "All sizes" },
  { value: "Tiny", label: "Tiny" },
  { value: "Small", label: "Small" },
  { value: "Medium", label: "Medium" },
  { value: "Large", label: "Large" },
  { value: "Huge", label: "Huge" },
  { value: "Gargantuan", label: "Gargantuan" },
];
