import type { DndItem } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { dndItemColumns } from "./dnd-item-columns";

interface DndItemDataTableProps {
  items: DndItem[];
  onRowClick: (item: DndItem) => void;
}

export function DndItemDataTable({ items, onRowClick }: DndItemDataTableProps) {
  return (
    <DataTable
      columns={dndItemColumns}
      data={items}
      onRowClick={onRowClick}
      emptyMessage="No items found with those filters."
      pageSize={25}
      initialColumnVisibility={{ mundaneMagic: false }}
      toolbar={(ctx) => (
        <p className="text-xs text-muted-foreground">
          Showing {ctx.filteredCount} of {ctx.totalCount} items
        </p>
      )}
    />
  );
}
