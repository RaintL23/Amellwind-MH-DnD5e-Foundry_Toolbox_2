import { useMemo } from "react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableFilterState } from "@/components/data-table/data-table.types";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import {
  bestiaryColumns,
  bestiaryGlobalFilter,
} from "./bestiary-columns";
import { BestiaryDataTableToolbar } from "./BestiaryDataTableToolbar";
import type { ColumnFiltersState } from "@tanstack/react-table";

interface BestiaryDataTableProps {
  creatures: BestiaryCreature[];
  typeOptions: string[];
  environmentOptions: string[];
  sourceOptions: SourceOption[];
  onRowClick: (creature: BestiaryCreature) => void;
  initialSearch?: string;
  initialColumnFilters?: ColumnFiltersState;
  onFilterStateChange?: (state: DataTableFilterState) => void;
}

export function BestiaryDataTable({
  creatures,
  typeOptions,
  environmentOptions,
  sourceOptions,
  onRowClick,
  initialSearch,
  initialColumnFilters,
  onFilterStateChange,
}: BestiaryDataTableProps) {
  const toolbarProps = useMemo(
    () => ({ typeOptions, environmentOptions, sourceOptions }),
    [typeOptions, environmentOptions, sourceOptions],
  );

  return (
    <DataTable
      columns={bestiaryColumns}
      data={creatures}
      getRowId={(row) => row.id}
      onRowClick={onRowClick}
      emptyMessage="No creatures found with those filters."
      pageSize={25}
      globalFilterFn={bestiaryGlobalFilter}
      initialColumnVisibility={{ environment: false }}
      initialSearch={initialSearch}
      initialColumnFilters={initialColumnFilters}
      onFilterStateChange={onFilterStateChange}
      toolbar={(ctx) => (
        <BestiaryDataTableToolbar
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
