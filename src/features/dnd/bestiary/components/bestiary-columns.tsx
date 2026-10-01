import { ColumnDef } from "@tanstack/react-table";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { SourceAbbreviations } from "@/shared/components/SourceAbbreviations";
import { parseCR } from "@/shared/utils/cr.utils";
import { cn } from "@/shared/utils/cn";

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
    sortingFn: "text",
  },
  {
    id: "cr",
    accessorFn: (row) => parseCR(row.cr),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CR" />
    ),
    cell: ({ row }) => <CrBadge cr={row.original.crDisplay || row.original.cr} />,
    sortingFn: "basic",
  },
  {
    accessorKey: "size",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.getValue("size")}
      </span>
    ),
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
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <SourceAbbreviations
        source={row.original.source}
        variantSources={row.original.variantSources}
      />
    ),
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
