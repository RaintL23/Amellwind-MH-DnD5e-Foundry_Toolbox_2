import { useCallback } from "react";
import type { Background } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { FactionBadge, backgroundColumns } from "./background-columns";

interface BackgroundDataTableProps {
  backgrounds: Background[];
  onRowClick: (background: Background) => void;
}

function getBackgroundRowId(row: Background): string {
  return row.id;
}

export function BackgroundDataTable({
  backgrounds,
  onRowClick,
}: BackgroundDataTableProps) {
  const renderMobileRow = useCallback(
    (bg: Background) => (
      <CompendiumMobileCard
        title={bg.name}
        onSelect={() => onRowClick(bg)}
        primary={<FactionBadge faction={bg.faction} />}
        secondary={<span className="truncate">{bg.proficiencies.skills}</span>}
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={backgroundColumns}
      data={backgrounds}
      getRowId={getBackgroundRowId}
      onRowClick={onRowClick}
      emptyMessage="No backgrounds found with those filters."
      pageSize={25}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
