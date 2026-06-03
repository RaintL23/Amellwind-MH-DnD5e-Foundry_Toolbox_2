import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { DndItem } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { cn } from "@/shared/utils/cn";

export const dndItemGlobalFilter: FilterFn<DndItem> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const item = row.original;
  if (item.searchText.includes(q)) return true;
  return (
    item.name.toLowerCase().includes(q) ||
    item.typeLabel.toLowerCase().includes(q) ||
    item.rarityLabel.toLowerCase().includes(q) ||
    (item.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false)
  );
};

const mundaneFilter: FilterFn<DndItem> = (row, _columnId, filterValue) => {
  if (!filterValue) return true;
  if (filterValue === "mundane") return row.original.isMundane;
  if (filterValue === "magic") return row.original.isMagic;
  return true;
};

function RarityBadge({ rarity, label }: { rarity: string; label: string }) {
  const color =
    rarity === "legendary"
      ? "text-orange-400 border-orange-800/50 bg-orange-950/40"
      : rarity === "very rare"
        ? "text-purple-400 border-purple-800/50 bg-purple-950/40"
        : rarity === "rare"
          ? "text-blue-400 border-blue-800/50 bg-blue-950/40"
          : rarity === "uncommon"
            ? "text-emerald-400 border-emerald-800/50 bg-emerald-950/40"
            : rarity === "none"
              ? "text-muted-foreground border-border bg-muted/30"
              : "text-amber-400 border-amber-800/50 bg-amber-950/40";

  return (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap",
        color,
      )}
    >
      {label}
    </span>
  );
}

export const dndItemColumns: ColumnDef<DndItem>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      return (
        <span className="font-medium text-foreground inline-flex items-center gap-1.5">
          {item.name}
          {item.isItemGroup && (
            <span className="rounded border border-sky-800/50 bg-sky-950/40 px-1.5 py-0.5 text-[10px] text-sky-400">
              Group
            </span>
          )}
          {item.isSpecificVariant && (
            <span
              className="rounded border border-violet-800/50 bg-violet-950/40 px-1.5 py-0.5 text-[10px] text-violet-400"
              title={item.baseName ? `Based on ${item.baseName}` : undefined}
            >
              Variant
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "typeLabel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.getValue("typeLabel")}
      </span>
    ),
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.typeLabel === String(value);
    },
  },
  {
    accessorKey: "rarity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rarity" />
    ),
    cell: ({ row }) => (
      <RarityBadge
        rarity={row.original.rarity}
        label={row.original.rarityLabel}
      />
    ),
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.rarity === String(value);
    },
  },
  {
    accessorKey: "valueGp",
    header: "Value",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.original.valueGp ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "weight",
    header: "Weight",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.original.weight ?? "—"}
      </span>
    ),
  },
  {
    id: "mundaneMagic",
    accessorFn: (row) => (row.isMundane ? "mundane" : "magic"),
    header: () => null,
    cell: () => null,
    enableSorting: false,
    filterFn: mundaneFilter,
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const sources = item.variantSources ?? [item.source];
      const label = sources.length <= 2 ? sources.join(", ") : `${sources[0]}`;
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
