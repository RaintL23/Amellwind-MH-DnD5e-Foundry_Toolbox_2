import { useCallback } from "react";
import type { Background } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { getEntityRowId } from "@/components/data-table/data-table-columns";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { FactionBadge, backgroundColumns } from "./background-columns";

interface BackgroundDataTableProps {
  backgrounds: Background[];
  onRowClick: (background: Background) => void;
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
      getRowId={getEntityRowId}
      onRowClick={onRowClick}
      pageSize={25}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
