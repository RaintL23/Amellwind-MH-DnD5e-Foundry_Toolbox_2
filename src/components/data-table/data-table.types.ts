import type {
  ColumnFiltersState,
  SortingState,
  Table as TanstackTable,
} from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- module augmentation requires type params
  interface ColumnMeta<TData, TValue> {
    filterOnly?: boolean;
  }
}

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
  sorting: SortingState;
}
