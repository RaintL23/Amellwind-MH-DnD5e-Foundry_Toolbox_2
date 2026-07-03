import { useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import type { DndRace } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableFilterState } from "@/components/data-table/data-table.types";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import { dndRaceColumns, raceGlobalFilter } from "./dnd-race-columns";
import { DndRaceDataTableToolbar } from "./DndRaceDataTableToolbar";

interface DndRaceDataTableProps {
  races: DndRace[];
  sourceOptions: SourceOption[];
  onRowClick: (race: DndRace) => void;
  initialSearch?: string;
  initialColumnFilters?: ColumnFiltersState;
  onFilterStateChange?: (state: DataTableFilterState) => void;
}

const GROUPED_SORT: SortingState = [{ id: "groupSort", desc: false }];

export function DndRaceDataTable({
  races,
  sourceOptions,
  onRowClick,
  initialSearch,
  initialColumnFilters,
  onFilterStateChange,
}: DndRaceDataTableProps) {
  const toolbarProps = useMemo(() => ({ sourceOptions }), [sourceOptions]);

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
      globalFilterFn={raceGlobalFilter}
      initialSearch={initialSearch}
      initialColumnFilters={initialColumnFilters}
      onFilterStateChange={onFilterStateChange}
      toolbar={(ctx) => (
        <DndRaceDataTableToolbar
          table={ctx.table}
          searchValue={ctx.searchValue}
          onSearchChange={ctx.onSearchChange}
          filteredCount={ctx.filteredCount}
          totalCount={ctx.totalCount}
          {...toolbarProps}
        />
      )}
    />
  );
}
