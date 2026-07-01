import type { ColumnFiltersState, Table as TanstackTable } from "@tanstack/react-table";

export interface DataTableToolbarContext<TData> {
  table: TanstackTable<TData>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export interface DataTableFilterState {
  search: string;
  columnFilters: ColumnFiltersState;
  pageIndex: number;
}
