import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useEffect } from "react";
import {
  FilterParams,
  QueryParamsList,
  SortParams,
} from "@/models/query-models/query-params-list";
import { ComparisonOperators } from "@/models/query-models/operators";
import {
  ColumnBasic,
  ColumnsDefFactory,
  prepareColumns,
} from "./data-table-interfaces";
import { xPagination } from "@/models/query-models/pagination";
import { useDataTableStoreContext } from "./data-table-store";
import DataTableBody from "./components/data-table-body";
import React from "react";

export interface DataTableAsyncProps<TData> {
  columns: ColumnBasic<TData>[];
  tableId: string;
  queryData: (filters?: QueryParamsList) => Promise<{
    data: TData[];
    paginationData: xPagination | null;
  }>;
}

export const DataTableAsync = <TData,>({
  columns,
  queryData,
  tableId,
}: DataTableAsyncProps<TData>) => {
  const {
    getData,
    setData,
    setRowSelected,
    setIsFresh,
    getIsFresh,
    getFiltering,
    setFiltering,
    getRowSelected,
  } = useDataTableStoreContext();
  const data = getData(tableId) as TData[];
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    getFiltering(tableId),
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [canFilter, setCanFilter] = React.useState(true);
  const columnsDataTable = prepareColumns(columns, canFilter);
  const [rowCount, setRowCount] = React.useState<number>(data.length);
  const isFirstRender = React.useRef(true);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [rowSelection, setRowSelection] = React.useState(
    getRowSelected(tableId),
  );
  const [localChange, setLocalChange] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);

  useEffect(() => {
    if (!localChange) {
      setLocalChange(true);
      setRowSelection(getRowSelected(tableId));
    } else {
      setLocalChange(false);
    }
  }, [setRowSelected]);

  useEffect(() => {
    if (!localChange) {
      setLocalChange(true);
      setRowSelected(tableId, rowSelection);
    } else {
      setLocalChange(false);
    }
  }, [rowSelection]);

  useEffect(() => {
    if (!localChange) {
      setLocalChange(true);
      setColumnFilters(getFiltering(tableId));
    } else {
      setLocalChange(false);
    }
  }, [setFiltering]);

  useEffect(() => {
    if (!localChange) {
      setLocalChange(true);
      setFiltering(tableId, columnFilters);
    } else {
      setLocalChange(false);
    }
  }, [columnFilters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filter = columnFilters.map((y) => {
        const column = columnsDataTable.find((x) => x.id == y.id);
        if (column != undefined && column != null) {
          const newFilter = {
            propertyName: column.accessorKey,
            value: y.value,
            type: column.type,
            typeOfSearch: column.comparisonFilter ?? ComparisonOperators.Equals,
          } as FilterParams;
          return newFilter;
        }
      }) as FilterParams[];

      const sort = sorting.map((y) => {
        const column = columnsDataTable.find((x) => x.id == y.id);
        if (column != undefined && column != null) {
          const newSort = {
            propertyName: column.accessorKey,
            order: y.desc ? "DESC" : "ASC",
          } as SortParams;
          return newSort;
        }
      }) as SortParams[];

      const queryParams = {
        filter,
        sort,
        pagination: {
          pageIndex: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
        },
      } as QueryParamsList;
      const response = await queryData(queryParams);
      if (response.data.length > 0) {
        setData(tableId, response.data as object[]);
        setRowCount(
          response.paginationData?.totalCount ?? response.data.length,
        );
      } else {
        if (response.paginationData) {
          if (response.paginationData.totalCount > 0) {
            setPagination({
              pageIndex: response.paginationData.totalPages - 1,
              pageSize: pagination.pageSize,
            });
            //como cambia la paginacion vuelve a consultar
          } else {
            const newPagination = {
              pageIndex: 0,
              pageSize: pagination.pageSize,
            };
            if (newPagination == pagination) {
              setPagination(newPagination);
            }
            setData(tableId, response.data as object[]);
            setRowCount(
              response.paginationData?.totalCount ?? response.data.length,
            );
          }
        } else {
          const newPagination = {
            pageIndex: 0,
            pageSize: pagination.pageSize,
          };
          if (newPagination == pagination) {
            setPagination(newPagination);
          }
          setData(tableId, response.data as object[]);
          setRowCount(response.data.length);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadData();
    }
  }, [sorting, pagination, columnFilters]);

  const isFresh = getIsFresh(tableId);
  useEffect(() => {
    void loadData().then(() => {
      setIsFresh(tableId, true);
    });
  }, [isFresh]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnsDefFactoryResponse = React.useMemo<ColumnDef<TData, any>[]>(
    () => [...ColumnsDefFactory(columnsDataTable)],
    [columnsDataTable, columns],
  );

  const table = useReactTable({
    data,
    columns: columnsDefFactoryResponse,
    state: {
      sorting,
      columnVisibility,
      rowSelection: rowSelection,
      columnFilters,
      pagination,
    },
    rowCount,
    enableRowSelection: true,
    manualFiltering: true,
    manualPagination: true,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <DataTableBody
      table={table}
      columnsBasic={columnsDataTable}
      loading={loading}
    />
  );
};
