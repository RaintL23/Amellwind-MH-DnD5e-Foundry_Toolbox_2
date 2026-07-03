import { useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { DndBackground } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableFilterState } from "@/components/data-table/data-table.types";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import {
  backgroundGlobalFilter,
  dndBackgroundColumns,
} from "./dnd-background-columns";
import { DndBackgroundDataTableToolbar } from "./DndBackgroundDataTableToolbar";

interface DndBackgroundDataTableProps {
  backgrounds: DndBackground[];
  sourceOptions: SourceOption[];
  onRowClick: (background: DndBackground) => void;
  initialSearch?: string;
  initialColumnFilters?: ColumnFiltersState;
  onFilterStateChange?: (state: DataTableFilterState) => void;
}

export function DndBackgroundDataTable({
  backgrounds,
  sourceOptions,
  onRowClick,
  initialSearch,
  initialColumnFilters,
  onFilterStateChange,
}: DndBackgroundDataTableProps) {
  const toolbarProps = useMemo(() => ({ sourceOptions }), [sourceOptions]);

  return (
    <DataTable
      columns={dndBackgroundColumns}
      data={backgrounds}
      onRowClick={onRowClick}
      emptyMessage="No backgrounds found with those filters."
      pageSize={25}
      globalFilterFn={backgroundGlobalFilter}
      initialSearch={initialSearch}
      initialColumnFilters={initialColumnFilters}
      onFilterStateChange={onFilterStateChange}
      toolbar={(ctx) => (
        <DndBackgroundDataTableToolbar
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
