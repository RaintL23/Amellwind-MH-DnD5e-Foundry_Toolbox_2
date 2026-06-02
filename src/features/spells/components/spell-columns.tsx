import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Spell } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { cn } from "@/shared/utils/cn";

const spellGlobalFilter: FilterFn<Spell> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const spell = row.original;
  if (spell.searchText?.includes(q)) return true;
  return (
    spell.name.toLowerCase().includes(q) ||
    spell.summary.toLowerCase().includes(q) ||
    spell.schoolName.toLowerCase().includes(q) ||
    spell.classNames.some((c) => c.toLowerCase().includes(q)) ||
    spell.classes.some((c) => c.toLowerCase().includes(q)) ||
    spell.variantSources?.some((s) => s.toLowerCase().includes(q))
  );
};

const classNameFilter: FilterFn<Spell> = (row, _columnId, filterValue) => {
  if (!filterValue) return true;
  return row.original.classNames.includes(String(filterValue));
};

// const flagsFilter: FilterFn<Spell> = (row, _columnId, filterValue) => {
//   if (!filterValue) return true;
//   if (filterValue === "ritual") return row.original.isRitual;
//   if (filterValue === "concentration") return row.original.isConcentration;
//   return true;
// };

const CELL_DISPLAY_MAX = 13;

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function TruncatedCell({ text }: { text: string }) {
  const display = truncateText(text, CELL_DISPLAY_MAX);
  return (
    <span
      className="text-muted-foreground whitespace-nowrap"
      title={text.length > CELL_DISPLAY_MAX ? text : undefined}
    >
      {display}
    </span>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap",
        level === 0
          ? "border-sky-800/50 bg-sky-950/40 text-sky-400"
          : "border-violet-800/50 bg-violet-950/40 text-violet-400",
      )}
    >
      {level === 0 ? "Cantrip" : `Lvl ${level}`}
    </span>
  );
}

export const spellColumns: ColumnDef<Spell>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const spell = row.original;
      const extraSources = (spell.variantCount ?? 1) - 1;
      return (
        <span className="font-medium text-foreground inline-flex items-center gap-1.5">
          {spell.name}
          {extraSources > 0 && (
            <span
              className="rounded border border-violet-800/50 bg-violet-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400"
              title={`${spell.variantCount} sources — open detail to compare`}
            >
              +{extraSources}
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "level",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => <LevelBadge level={row.getValue("level")} />,
    filterFn: (row, _id, value) => {
      if (value === "" || value === undefined) return true;
      return row.getValue("level") === Number(value);
    },
    sortingFn: "basic",
  },
  {
    accessorKey: "schoolName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="School" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {row.getValue("schoolName")}
      </span>
    ),
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.school === String(value);
    },
  },
  {
    accessorKey: "castingTime",
    header: "Casting Time",
    enableSorting: false,
    cell: ({ row }) => (
      <TruncatedCell text={String(row.getValue("castingTime") ?? "")} />
    ),
  },
  {
    accessorKey: "range",
    header: "Range",
    enableSorting: false,
    cell: ({ row }) => (
      <TruncatedCell text={String(row.getValue("range") ?? "")} />
    ),
  },
  // {
  //   id: "flags",
  //   accessorFn: (row) =>
  //     [row.isRitual && "ritual", row.isConcentration && "concentration"].filter(Boolean).join(","),
  //   header: "Tags",
  //   enableSorting: false,
  //   filterFn: flagsFilter,
  //   cell: ({ row }) => {
  //     const spell = row.original;
  //     return (
  //       <div className="flex flex-wrap gap-1">
  //         {spell.isRitual && (
  //           <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/50 text-[10px]">
  //             Ritual
  //           </Badge>
  //         )}
  //         {spell.isConcentration && (
  //           <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/50 text-[10px]">
  //             Conc.
  //           </Badge>
  //         )}
  //         {!spell.isRitual && !spell.isConcentration && (
  //           <span className="text-muted-foreground/40 text-xs">—</span>
  //         )}
  //       </div>
  //     );
  //   },
  // },
  /** Solo para filtro del toolbar; no se muestra en la tabla */
  {
    accessorKey: "classNames",
    header: () => null,
    cell: () => null,
    enableSorting: false,
    filterFn: classNameFilter,
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      const spell = row.original;
      const sources = spell.variantSources ?? [spell.source];
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

export { spellGlobalFilter };
