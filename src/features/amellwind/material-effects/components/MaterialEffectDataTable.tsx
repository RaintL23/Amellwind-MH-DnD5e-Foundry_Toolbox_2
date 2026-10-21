import { useCallback } from "react";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import type { MaterialEffect } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import {
  MaterialEffectRarityBadge,
  MaterialEffectSlotBadge,
  materialEffectColumns,
} from "./material-effect-columns";

interface MaterialEffectDataTableProps {
  effects: MaterialEffect[];
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onRowClick: (effect: MaterialEffect) => void;
}

function getEffectRowId(row: MaterialEffect): string {
  return row.id;
}

export function MaterialEffectDataTable({
  effects,
  pagination,
  onPaginationChange,
  onRowClick,
}: MaterialEffectDataTableProps) {
  const renderMobileRow = useCallback(
    (effect: MaterialEffect) => (
      <CompendiumMobileCard
        title={effect.name}
        onSelect={() => onRowClick(effect)}
        primary={
          <>
            <MaterialEffectRarityBadge rarity={effect.rarity} />
            <MaterialEffectSlotBadge slot={effect.slot} />
          </>
        }
        secondary={<span className="line-clamp-2">{effect.summary}</span>}
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={materialEffectColumns}
      data={effects}
      getRowId={getEffectRowId}
      onRowClick={onRowClick}
      emptyMessage="No material effects match your filters."
      enableSearchToolbar={false}
      initialSorting={[]}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      autoResetPageIndex={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
