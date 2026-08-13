import { ColumnDef, FilterFn } from "@tanstack/react-table";
import type { DndRace } from "@/shared/types";
import { DND_RACE_KIND_LABELS } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { compareRacesForGroupedList } from "../utils/dnd-race-dedupe.utils";

export const raceGlobalFilter: FilterFn<DndRace> = (
  row,
  _columnId,
  filterValue,
) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const race = row.original;
  if (race.searchText?.includes(q)) return true;
  return (
    race.name.toLowerCase().includes(q) ||
    (race.parentName?.toLowerCase().includes(q) ?? false) ||
    race.traitTags.some((t) => t.toLowerCase().includes(q)) ||
    (race.variantSources?.some((s) => s.toLowerCase().includes(q)) ?? false)
  );
};

function KindBadge({ kind }: { kind: DndRace["kind"] }) {
  const label = DND_RACE_KIND_LABELS[kind];
  return (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap",
        kind === "species"
          ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-400"
          : kind === "lineage"
            ? "border-violet-800/50 bg-violet-950/40 text-violet-400"
            : "border-sky-800/50 bg-sky-950/40 text-sky-400",
      )}
    >
      {label}
    </span>
  );
}

export const dndRaceColumns: ColumnDef<DndRace>[] = [
  /** Hidden column to keep subraces grouped under their parent species when sorting. */
  {
    id: "groupSort",
    accessorFn: (row) => row,
    header: () => null,
    cell: () => null,
    enableSorting: true,
    enableHiding: true,
    sortingFn: (rowA, rowB) =>
      compareRacesForGroupedList(rowA.original, rowB.original),
  },
  {
    accessorKey: "name",
    enableSorting: false,
    header: "Name",
    cell: ({ row }) => {
      const race = row.original;
      const isChild = Boolean(race.parentName);
      return (
        <div className={cn("flex items-center gap-1.5", isChild && "pl-5")}>
          {isChild && (
            <span
              className="text-muted-foreground/50 text-xs shrink-0"
              aria-hidden
            >
              └
            </span>
          )}
          <span
            className={cn(
              isChild ? "text-foreground/90" : "font-medium text-foreground",
            )}
          >
            {race.name}
          </span>
          {isChild && race.parentName && (
            <span className="text-xs text-muted-foreground shrink-0">
              ({race.parentName})
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "kind",
    enableSorting: false,
    header: "Kind",
    cell: ({ row }) => <KindBadge kind={row.original.kind} />,
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.kind === String(value);
    },
  },
  {
    accessorKey: "sizes",
    header: "Size",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.original.sizes.join(", ")}
      </span>
    ),
  },
  {
    accessorKey: "source",
    enableSorting: false,
    header: "Source",
    cell: ({ row }) => {
      const race = row.original;
      const sources = race.variantSources ?? [race.source];
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
