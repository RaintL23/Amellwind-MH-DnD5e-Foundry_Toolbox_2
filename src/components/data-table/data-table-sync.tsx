/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  ColumnBasic,
  ColumnsDefFactory,
  prepareColumns,
} from "./data-table-interfaces";
import DataTableBody from "./components/data-table-body";
import { useDataTableStoreContext } from "./data-table-store";
import { useEffect } from "react";

export interface DataTablePropsSync<TData> {
  tableId: string;
  columns: ColumnBasic<TData>[];
  initialData: TData[];
}
// TO DO: añadir funcionalidad de actualización de datos al hook
export const DataTableSync = <TData,>({
  initialData,
  columns,
  tableId,
}: DataTablePropsSync<TData>) => {
  const { getData, setData, setRowSelected, getIsFresh, setIsFresh } =
    useDataTableStoreContext();
  const data = getData(tableId) as TData[];
  const [canFilter] = React.useState(true);
  const columnsDataTable = prepareColumns(columns, canFilter);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  useEffect(() => {
    setData(tableId, initialData as object[]);
  }, []);

  useEffect(() => {
    setRowSelected(tableId, rowSelection);
  }, [rowSelection]);

  const columnsDefFactoryResponse = React.useMemo<ColumnDef<TData, any>[]>(
    () => [...ColumnsDefFactory(columnsDataTable)],
    [columnsDataTable, columns]
  );

  const table = useReactTable({
    data,
    columns: columnsDefFactoryResponse,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onGlobalFilterChange: setGlobalFilter,
  });

  const isFresh = getIsFresh(tableId);
  useEffect(() => {
    setIsFresh(tableId, true);
  }, [isFresh]);

  return (
    <DataTableBody
      table={table}
      columnsBasic={columnsDataTable}
      loading={false}
    />
  );
};
