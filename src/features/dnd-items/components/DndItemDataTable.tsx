import { useMemo } from "react";
import { DndItem } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import { dndItemColumns, dndItemGlobalFilter } from "./dnd-item-columns";
import { DndItemDataTableToolbar } from "./DndItemDataTableToolbar";

interface DndItemDataTableProps {
  items: DndItem[];
  sourceOptions: SourceOption[];
  rarityOptions: string[];
  typeOptions: string[];
  onRowClick: (item: DndItem) => void;
}

export function DndItemDataTable({
  items,
  sourceOptions,
  rarityOptions,
  typeOptions,
  onRowClick,
}: DndItemDataTableProps) {
  const toolbarProps = useMemo(
    () => ({ sourceOptions, rarityOptions, typeOptions }),
    [sourceOptions, rarityOptions, typeOptions],
  );

  return (
    <DataTable
      columns={dndItemColumns}
      data={items}
      onRowClick={onRowClick}
      emptyMessage="No items found with those filters."
      pageSize={25}
      globalFilterFn={dndItemGlobalFilter}
      initialColumnVisibility={{ mundaneMagic: false }}
      toolbar={(ctx) => (
        <DndItemDataTableToolbar
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
