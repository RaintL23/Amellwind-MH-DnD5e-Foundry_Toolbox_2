import { useCallback } from "react";
import type { DndItem } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import {
  CompendiumMobileCard,
  formatVariantSources,
} from "@/shared/components/CompendiumMobileCard";
import { dndItemColumns } from "./dnd-item-columns";

interface DndItemDataTableProps {
  items: DndItem[];
  onRowClick: (item: DndItem) => void;
}

function getItemRowId(row: DndItem): string {
  return row.id;
}

export function DndItemDataTable({ items, onRowClick }: DndItemDataTableProps) {
  const renderMobileRow = useCallback(
    (item: DndItem) => (
      <CompendiumMobileCard
        title={item.name}
        onSelect={() => onRowClick(item)}
        primary={
          <>
            <span>{item.rarityLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{item.isMagic ? "Magic" : "Mundane"}</span>
          </>
        }
        secondary={
          <>
            <span className="truncate">{item.typeLabel}</span>
            <span aria-hidden="true">·</span>
            <span>
              {formatVariantSources(item.source, item.variantSources)}
            </span>
          </>
        }
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={dndItemColumns}
      data={items}
      getRowId={getItemRowId}
      onRowClick={onRowClick}
      emptyMessage="No items found with those filters."
      pageSize={25}
      initialColumnVisibility={{ mundaneMagic: false }}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
