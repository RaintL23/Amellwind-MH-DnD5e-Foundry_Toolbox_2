import {

  ColumnDef,

  ColumnFiltersState,

  FilterFn,

  SortingState,

  VisibilityState,

  flexRender,

  getCoreRowModel,

  getFilteredRowModel,

  getPaginationRowModel,

  getSortedRowModel,

  useReactTable,

} from "@tanstack/react-table";

import { useCallback, useDeferredValue, useEffect, useState } from "react";

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/ui/table";

import { Pagination } from "@/components/ui/pagination";

import type { DataTableToolbarContext } from "./data-table.types";



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

}: DataTableProps<TData, TValue>) {

  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const [columnFilters, setColumnFilters] =

    useState<ColumnFiltersState>(initialColumnFilters);

  const [columnVisibility, setColumnVisibility] =

    useState<VisibilityState>(initialColumnVisibility);

  const [searchInput, setSearchInput] = useState("");

  const deferredSearch = useDeferredValue(searchInput);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });



  const table = useReactTable({

    data,

    columns,

    getRowId: getRowId ? (row) => getRowId(row) : undefined,

    state: {

      sorting,

      columnFilters,

      columnVisibility,

      globalFilter: deferredSearch,

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

    globalFilterFn,

    enableMultiSort,

  });



  const onSearchChange = useCallback((value: string) => {

    setSearchInput(value);

  }, []);



  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    if (lockedSorting) {
      setSorting(lockedSorting);
    }
  }, [deferredSearch, columnFilters, lockedSorting]);



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

      {toolbar?.({

        table,

        searchValue: searchInput,

        onSearchChange,

        filteredCount,

        totalCount,

      })}



      <div className="rounded-lg border border-border overflow-hidden">

        <Table>

          <TableHeader>

            {table.getHeaderGroups().map((headerGroup) => (

              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">

                {headerGroup.headers
                  .filter((header) => header.column.getIsVisible())
                  .map((header) => (

                  <TableHead key={header.id}>

                    {header.isPlaceholder

                      ? null

                      : flexRender(header.column.columnDef.header, header.getContext())}

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

                  className={onRowClick ? "cursor-pointer" : undefined}

                  onClick={onRowClick ? () => handleRowClick(row.original) : undefined}

                >

                  {row.getVisibleCells().map((cell) => (

                    <TableCell key={cell.id}>

                      {flexRender(cell.column.columnDef.cell, cell.getContext())}

                    </TableCell>

                  ))}

                </TableRow>

              ))

            ) : (

              <TableRow className="hover:bg-transparent">

                <TableCell

                  colSpan={table.getVisibleLeafColumns().length || columns.length}

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

    </div>

  );

}


