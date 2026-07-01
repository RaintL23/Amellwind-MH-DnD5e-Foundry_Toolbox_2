import { useMemo } from "react";
import { Class } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableFilterState } from "@/components/data-table/data-table.types";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import { classColumns, classGlobalFilter } from "./class-columns";
import { defaultSelectedSources } from "./table/class-table.constants";
import { ClassDataTableToolbar } from "./table/ClassDataTableToolbar";
import type { ColumnFiltersState } from "@tanstack/react-table";

export {
  DEFAULT_EXCLUDED_SOURCES,
  defaultSelectedSources,
} from "./table/class-table.constants";

interface ClassDataTableProps {
  classes: Class[];
  sourceOptions: SourceOption[];
  onRowClick: (cls: Class) => void;
  initialSearch?: string;
  initialColumnFilters?: ColumnFiltersState;
  onFilterStateChange?: (state: DataTableFilterState) => void;
}

export function ClassDataTable({
  classes,
  sourceOptions,
  onRowClick,
  initialSearch,
  initialColumnFilters,
  onFilterStateChange,
}: ClassDataTableProps) {
  const resolvedInitialColumnFilters = useMemo(() => {
    // If caller provides filters from URL, use them; otherwise apply default source selection
    if (initialColumnFilters !== undefined) return initialColumnFilters;
    const initialSourceFilter = defaultSelectedSources(
      sourceOptions.map((option) => option.value),
    );
    return [{ id: "source", value: initialSourceFilter }] as ColumnFiltersState;
  }, [initialColumnFilters, sourceOptions]);

  return (
    <DataTable
      columns={classColumns}
      data={classes}
      onRowClick={onRowClick}
      emptyMessage="No classes found with those filters."
      pageSize={25}
      globalFilterFn={classGlobalFilter}
      initialColumnVisibility={{ edition: false }}
      initialColumnFilters={resolvedInitialColumnFilters}
      initialSearch={initialSearch}
      onFilterStateChange={onFilterStateChange}
      toolbar={(ctx) => (
        <ClassDataTableToolbar
          table={ctx.table}
          searchValue={ctx.searchValue}
          onSearchChange={ctx.onSearchChange}
          filteredCount={ctx.filteredCount}
          totalCount={ctx.totalCount}
          sourceOptions={sourceOptions}
        />
      )}
    />
  );
}
