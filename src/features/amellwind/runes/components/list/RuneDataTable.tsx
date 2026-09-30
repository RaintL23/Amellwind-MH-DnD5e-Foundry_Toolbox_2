import { useCallback, useMemo } from "react";
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import { createRuneColumns, runeRowClassName } from "./rune-columns";
import { runeRowKey, type RuneListRow } from "./rune-table-filters.utils";

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

  const renderMobileRow = useCallback(
    (row: RuneListRow) => {
      const rune = row.rune;
      return (
        <CompendiumMobileCard
          title={rune.name}
          onSelect={() => onSelect(rune)}
          primary={
            <>
              <span className="rounded border border-amber-800/50 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                Tier {rune.tier}
              </span>
              {isInBuild(rune) ? (
                <span className="text-[10px] font-medium text-amber-400">
                  In build
                </span>
              ) : null}
            </>
          }
          secondary={
            <>
              <span className="truncate">{rune.monsterName}</span>
              <span aria-hidden="true">·</span>
              <span>{rune.monsterSource}</span>
            </>
          }
        />
      );
    },
    [isInBuild, onSelect],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => runeRowKey(row.rune)}
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
      autoResetPageIndex={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
