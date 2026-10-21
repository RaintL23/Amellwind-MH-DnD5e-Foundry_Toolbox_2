import { useCallback } from "react";
import type { Feat } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { getEntityRowId } from "@/components/data-table/data-table-columns";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { featColumns } from "./feat-columns";

interface FeatDataTableProps {
  feats: Feat[];
  onRowClick: (feat: Feat) => void;
}

export function FeatDataTable({ feats, onRowClick }: FeatDataTableProps) {
  const renderMobileRow = useCallback(
    (feat: Feat) => (
      <CompendiumMobileCard
        title={feat.name}
        onSelect={() => onRowClick(feat)}
        primary={
          feat.prerequisites.length > 0 || feat.repeatable ? (
            <span className="truncate">
              {[...feat.prerequisites, feat.repeatable ? "Repeatable" : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          ) : undefined
        }
        secondary={<span>{feat.source}</span>}
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={featColumns}
      data={feats}
      getRowId={getEntityRowId}
      onRowClick={onRowClick}
      pageSize={30}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
