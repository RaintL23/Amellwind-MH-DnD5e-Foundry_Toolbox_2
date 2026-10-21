import { useCallback } from "react";
import type { DndFeat } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { getEntityRowId } from "@/components/data-table/data-table-columns";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { SourceAbbreviations } from "@/shared/components/SourceAbbreviations";
import { dndFeatColumns, getDndFeatTypeLabel } from "./dnd-feat-columns";

interface DndFeatDataTableProps {
  feats: DndFeat[];
  onRowClick: (feat: DndFeat) => void;
}

export function DndFeatDataTable({ feats, onRowClick }: DndFeatDataTableProps) {
  const renderMobileRow = useCallback(
    (feat: DndFeat) => {
      const typeLabel = getDndFeatTypeLabel(feat);
      return (
        <CompendiumMobileCard
          title={feat.name}
          onSelect={() => onRowClick(feat)}
          primary={typeLabel ? <span>{typeLabel}</span> : undefined}
          secondary={
            <>
              {feat.prerequisites.length > 0 ? (
                <>
                  <span className="truncate">
                    {feat.prerequisites.join(", ")}
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <SourceAbbreviations
                source={feat.source}
                variantSources={feat.variantSources}
                maxVisible={1}
                nativeTitle
              />
            </>
          }
        />
      );
    },
    [onRowClick],
  );

  return (
    <DataTable
      columns={dndFeatColumns}
      data={feats}
      getRowId={getEntityRowId}
      onRowClick={onRowClick}
      pageSize={30}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
