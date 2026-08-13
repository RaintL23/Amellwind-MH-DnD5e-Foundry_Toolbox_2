import { ColumnDef, FilterFn } from "@tanstack/react-table";
import type { DndBackground } from "@/shared/types";

export const backgroundGlobalFilter: FilterFn<DndBackground> = (
  row,
  _columnId,
  filterValue,
) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const bg = row.original;
  if (bg.searchText?.includes(q)) return true;
  return (
    bg.name.toLowerCase().includes(q) ||
    bg.proficiencies.skills.toLowerCase().includes(q) ||
    bg.proficiencies.tools.toLowerCase().includes(q) ||
    bg.proficiencies.languages.toLowerCase().includes(q) ||
    (bg.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false)
  );
};

export const dndBackgroundColumns: ColumnDef<DndBackground>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    cell: ({ row }) => {
      const bg = row.original;
      const sources = bg.variantSources ?? [bg.source];
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
