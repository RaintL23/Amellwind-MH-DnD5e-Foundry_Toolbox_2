import { useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { Spell } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableFilterState } from "@/components/data-table/data-table.types";
import type { SourceOption } from "../services/book-source.service";
import { spellColumns, spellGlobalFilter } from "./spell-columns";
import { SpellDataTableToolbar } from "./SpellDataTableToolbar";

interface SpellDataTableProps {
  spells: Spell[];
  classOptions: string[];
  sourceOptions: SourceOption[];
  onRowClick: (spell: Spell) => void;
  initialSearch?: string;
  initialColumnFilters?: ColumnFiltersState;
  onFilterStateChange?: (state: DataTableFilterState) => void;
}

export function SpellDataTable({
  spells,
  classOptions,
  sourceOptions,
  onRowClick,
  initialSearch,
  initialColumnFilters,
  onFilterStateChange,
}: SpellDataTableProps) {
  const toolbarProps = useMemo(
    () => ({ classOptions, sourceOptions }),
    [classOptions, sourceOptions],
  );

  return (
    <DataTable
      columns={spellColumns}
      data={spells}
      initialSorting={[
        { id: "level", desc: false },
        { id: "name", desc: false },
      ]}
      onRowClick={onRowClick}
      emptyMessage="No spells found with those filters."
      pageSize={25}
      globalFilterFn={spellGlobalFilter}
      initialColumnVisibility={{ classNames: false }}
      initialSearch={initialSearch}
      initialColumnFilters={initialColumnFilters}
      onFilterStateChange={onFilterStateChange}
      toolbar={(ctx) => (
        <SpellDataTableToolbar
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
