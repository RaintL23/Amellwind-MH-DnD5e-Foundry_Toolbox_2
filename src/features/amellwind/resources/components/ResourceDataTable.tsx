import { useCallback } from "react";
import type { Resource } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { ResourceRarityBadge } from "@/shared/components/ResourceRarityBadge";
import { getResourceRowId, resourceColumns } from "./resource-columns";

interface ResourceDataTableProps {
  resources: Resource[];
  onRowClick: (resource: Resource) => void;
}

const RESOURCE_INITIAL_SORTING = [{ id: "rarity", desc: false }];

export function ResourceDataTable({
  resources,
  onRowClick,
}: ResourceDataTableProps) {
  const renderMobileRow = useCallback(
    (resource: Resource) => (
      <CompendiumMobileCard
        title={resource.name}
        onSelect={() => onRowClick(resource)}
        primary={
          <>
            <ResourceRarityBadge rarity={resource.rarity} />
            <span>{resource.category}</span>
          </>
        }
        secondary={<span>{resource.sellValue}</span>}
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={resourceColumns}
      data={resources}
      getRowId={getResourceRowId}
      onRowClick={onRowClick}
      pageSize={25}
      enableSearchToolbar={false}
      initialSorting={RESOURCE_INITIAL_SORTING}
      renderMobileRow={renderMobileRow}
    />
  );
}
