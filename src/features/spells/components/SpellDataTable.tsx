import { useMemo } from "react";
import { Spell } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import type { SourceOption } from "../services/book-source.service";
import { spellColumns, spellGlobalFilter } from "./spell-columns";
import { SpellDataTableToolbar } from "./SpellDataTableToolbar";

interface SpellDataTableProps {
  spells: Spell[];
  classOptions: string[];
  sourceOptions: SourceOption[];
  onRowClick: (spell: Spell) => void;
}

export function SpellDataTable({
  spells,
  classOptions,
  sourceOptions,
  onRowClick,
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
