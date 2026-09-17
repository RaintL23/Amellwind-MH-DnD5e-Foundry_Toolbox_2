import type { DndBackground } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { dndBackgroundColumns } from "./dnd-background-columns";

interface DndBackgroundDataTableProps {
  backgrounds: DndBackground[];
  onRowClick: (background: DndBackground) => void;
}

export function DndBackgroundDataTable({
  backgrounds,
  onRowClick,
}: DndBackgroundDataTableProps) {
  return (
    <DataTable
      columns={dndBackgroundColumns}
      data={backgrounds}
      onRowClick={onRowClick}
      emptyMessage="No backgrounds found with those filters."
      pageSize={25}
      enableSearchToolbar={false}
    />
  );
}
