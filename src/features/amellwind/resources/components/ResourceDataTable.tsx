import { useCallback } from "react";
import type { Resource } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import {
  ResourceRarityBadge,
  getResourceRowId,
  resourceColumns,
} from "./resource-columns";

interface ResourceDataTableProps {
  resources: Resource[];
  onRowClick: (resource: Resource) => void;
}

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
      emptyMessage="No resources found."
      pageSize={25}
      enableSearchToolbar={false}
      initialSorting={[{ id: "rarity", desc: false }]}
      renderMobileRow={renderMobileRow}
    />
  );
}
