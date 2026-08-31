import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  OnChangeFn,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import type {
  DataTableFilterState,
  DataTableToolbarContext,
} from "./data-table.types";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  toolbar?: (ctx: DataTableToolbarContext<TData>) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  pageSize?: number;
  globalFilterFn?: FilterFn<TData>;
  initialColumnVisibility?: VisibilityState;
  initialColumnFilters?: ColumnFiltersState;
  initialSorting?: SortingState;
  /** Re-applied whenever search or column filters change (keeps grouped lists stable). */
  lockedSorting?: SortingState;
  enableMultiSort?: boolean;
  getRowId?: (row: TData) => string;
  /** Initial search text to restore (e.g. from URL params). */
  initialSearch?: string;
  /** Fires whenever search, column filters, or page index change, so callers can persist state. */
  onFilterStateChange?: (state: DataTableFilterState) => void;
  /** Controlled column filters (skips internal filter state when set with onColumnFiltersChange). */
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  /** Controlled sort state. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Controlled pagination (pageIndex is 0-based). */
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** When false, no built-in debounced search toolbar is used. */
  enableSearchToolbar?: boolean;
  getRowClassName?: (row: TData) => string | undefined;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  onRowClick,
  emptyMessage = "No results.",
  pageSize = 20,
  globalFilterFn,
  initialColumnVisibility = {},
  initialColumnFilters = [],
  initialSorting = [{ id: "name", desc: false }],
  lockedSorting,
  enableMultiSort = true,
  getRowId,
  initialSearch = "",
  onFilterStateChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  sorting: controlledSorting,
  onSortingChange,
  pagination: controlledPagination,
  onPaginationChange,
  enableSearchToolbar = true,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] =
    useState<SortingState>(initialSorting);
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility);
  const [committedSearch, setCommittedSearch] = useState(initialSearch);
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(committedSearch, setCommittedSearch);
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  const sorting = controlledSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const setColumnFilters = onColumnFiltersChange ?? setInternalColumnFilters;
  const pagination = controlledPagination ?? internalPagination;
  const setPagination = onPaginationChange ?? setInternalPagination;

  const table = useReactTable({
    data,
    columns,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: enableSearchToolbar ? appliedSearch : undefined,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: enableSearchToolbar ? globalFilterFn : undefined,
    enableMultiSort,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    if (lockedSorting) {
      setSorting(lockedSorting);
    }
  }, [enableSearchToolbar ? appliedSearch : null, columnFilters, lockedSorting, setPagination, setSorting]);

  useEffect(() => {
    onFilterStateChange?.({
      search: enableSearchToolbar ? appliedSearch : "",
      columnFilters,
      pageIndex: pagination.pageIndex,
      sorting,
    });
  }, [
    enableSearchToolbar ? appliedSearch : "",
    columnFilters,
    pagination.pageIndex,
    sorting,
    onFilterStateChange,
    enableSearchToolbar,
  ]);

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;
  const currentPageSize = table.getState().pagination.pageSize;

  const handleRowClick = useCallback(
    (row: TData) => {
      onRowClick?.(row);
    },
    [onRowClick],
  );

  return (
    <div className="space-y-4">
      {enableSearchToolbar &&
        toolbar?.({
          table,
          searchValue: searchDraft,
          onSearchChange: setSearchDraft,
          filteredCount,
          totalCount,
        })}

      {enableSearchToolbar && isSearchPending ? (
        <ListAreaLoading />
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-muted/50 hover:bg-muted/50"
                  >
                    {headerGroup.headers
                      .filter(
                        (header) =>
                          header.column.getIsVisible() &&
                          !header.column.columnDef.meta?.filterOnly,
                      )
                      .map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={[
                        onRowClick ? "cursor-pointer" : undefined,
                        getRowClassName?.(row.original),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={
                        onRowClick
                          ? () => handleRowClick(row.original)
                          : undefined
                      }
                    >
                      {row
                        .getVisibleCells()
                        .filter(
                          (cell) => !cell.column.columnDef.meta?.filterOnly,
                        )
                        .map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={
                        table
                          .getVisibleLeafColumns()
                          .filter((col) => !col.columnDef.meta?.filterOnly)
                          .length || columns.length
                      }
                      className="h-24 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredCount > 0 && (
            <Pagination
              page={pageIndex + 1}
              totalPages={Math.max(1, pageCount)}
              totalItems={filteredCount}
              pageSize={currentPageSize}
              onPageChange={(p) => table.setPageIndex(p - 1)}
              onPageSizeChange={(size) => {
                table.setPageSize(size);
                table.setPageIndex(0);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
