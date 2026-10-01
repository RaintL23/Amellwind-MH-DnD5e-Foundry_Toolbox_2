import { useCallback } from "react";
import type { DndBackground } from "@/shared/types";
import { DND_BACKGROUND_EDITION_LABELS } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { SourceAbbreviations } from "@/shared/components/SourceAbbreviations";
import { dndBackgroundColumns } from "./dnd-background-columns";

interface DndBackgroundDataTableProps {
  backgrounds: DndBackground[];
  onRowClick: (background: DndBackground) => void;
}

function getBackgroundRowId(row: DndBackground): string {
  return row.id;
}

export function DndBackgroundDataTable({
  backgrounds,
  onRowClick,
}: DndBackgroundDataTableProps) {
  const renderMobileRow = useCallback(
    (bg: DndBackground) => (
      <CompendiumMobileCard
        title={bg.name}
        onSelect={() => onRowClick(bg)}
        primary={
          bg.edition ? (
            <span>
              {DND_BACKGROUND_EDITION_LABELS[bg.edition] ?? bg.edition}
            </span>
          ) : undefined
        }
        secondary={
          <>
            {bg.abilitySummary ? (
              <span className="truncate">{bg.abilitySummary}</span>
            ) : null}
            {bg.abilitySummary ? <span aria-hidden="true">·</span> : null}
            <SourceAbbreviations
              source={bg.source}
              variantSources={bg.variantSources}
              maxVisible={1}
              nativeTitle
            />
          </>
        }
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={dndBackgroundColumns}
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
