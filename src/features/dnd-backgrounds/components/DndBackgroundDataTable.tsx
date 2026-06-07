import { useMemo } from "react";
import type { DndBackground } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
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
}

export function DndBackgroundDataTable({
  backgrounds,
  sourceOptions,
  onRowClick,
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
