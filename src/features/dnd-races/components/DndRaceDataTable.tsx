import type { SortingState } from "@tanstack/react-table";
import type { DndRace } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { dndRaceColumns } from "./dnd-race-columns";

interface DndRaceDataTableProps {
  races: DndRace[];
  onRowClick: (race: DndRace) => void;
}

const GROUPED_SORT: SortingState = [{ id: "groupSort", desc: false }];

export function DndRaceDataTable({ races, onRowClick }: DndRaceDataTableProps) {
  return (
    <DataTable
      columns={dndRaceColumns}
      data={races}
      initialSorting={GROUPED_SORT}
      lockedSorting={GROUPED_SORT}
      enableMultiSort={false}
      initialColumnVisibility={{ groupSort: false }}
      onRowClick={onRowClick}
      emptyMessage="No races found with those filters."
      pageSize={25}
      toolbar={(ctx) => (
        <p className="text-xs text-muted-foreground">
          Showing {ctx.filteredCount} of {ctx.totalCount} races
        </p>
      )}
    />
  );
}
