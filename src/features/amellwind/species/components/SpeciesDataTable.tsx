import { useCallback } from "react";
import type { Species } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { SpeciesCategoryBadge, speciesColumns } from "./species-columns";

interface SpeciesDataTableProps {
  species: Species[];
  onRowClick: (species: Species) => void;
}

function getSpeciesRowId(row: Species): string {
  return row.id;
}

export function SpeciesDataTable({ species, onRowClick }: SpeciesDataTableProps) {
  const renderMobileRow = useCallback(
    (item: Species) => (
      <CompendiumMobileCard
        title={item.name}
        onSelect={() => onRowClick(item)}
        primary={<SpeciesCategoryBadge category={item.category} />}
        secondary={
          <>
            <span className="truncate">{item.abilitySummary}</span>
            <span aria-hidden="true">·</span>
            <span>{item.source}</span>
          </>
        }
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={speciesColumns}
      data={species}
      getRowId={getSpeciesRowId}
      onRowClick={onRowClick}
      emptyMessage="No species found with those filters."
      pageSize={25}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
