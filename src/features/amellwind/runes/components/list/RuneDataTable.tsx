import { useMemo } from "react";
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import {
  createRuneColumns,
  runeRowClassName,
} from "./rune-columns";
import type { RuneListRow } from "./rune-table-filters.utils";

interface RuneDataTableProps {
  rows: RuneListRow[];
  materialEffectIndex: MaterialEffectNameIndex | null;
  isInBuild: (rune: RuneListRow["rune"]) => boolean;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSelect: (rune: RuneListRow["rune"]) => void;
}

export function RuneDataTable({
  rows,
  materialEffectIndex,
  isInBuild,
  columnFilters,
  onColumnFiltersChange,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  onSelect,
}: RuneDataTableProps) {
  const columns = useMemo(
    () => createRuneColumns({ isInBuild, materialEffectIndex }),
    [isInBuild, materialEffectIndex],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) =>
        `${row.rune.monsterSource}-${row.rune.monsterName}-${row.rune.name}`
      }
      onRowClick={(row) => onSelect(row.rune)}
      getRowClassName={(row) => runeRowClassName(row, isInBuild)}
      emptyMessage="No materials found with the applied filters."
      enableSearchToolbar={false}
      enableMultiSort={false}
      initialSorting={[]}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
}
