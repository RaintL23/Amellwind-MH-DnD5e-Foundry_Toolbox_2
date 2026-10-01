import { useCallback } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { DndRace } from "@/shared/types";
import { DND_RACE_KIND_LABELS } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { SourceAbbreviations } from "@/shared/components/SourceAbbreviations";
import { dndRaceColumns } from "./dnd-race-columns";

interface DndRaceDataTableProps {
  races: DndRace[];
  onRowClick: (race: DndRace) => void;
}

const GROUPED_SORT: SortingState = [{ id: "groupSort", desc: false }];

function getRaceRowId(row: DndRace): string {
  return row.id;
}

export function DndRaceDataTable({ races, onRowClick }: DndRaceDataTableProps) {
  const renderMobileRow = useCallback(
    (race: DndRace) => (
      <CompendiumMobileCard
        title={race.name}
        onSelect={() => onRowClick(race)}
        primary={
          <>
            <span>{DND_RACE_KIND_LABELS[race.kind] ?? race.kind}</span>
            {race.sizes.length > 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{race.sizes.join(", ")}</span>
              </>
            ) : null}
          </>
        }
        secondary={
          <>
            {race.parentName ? <span>{race.parentName}</span> : null}
            {race.parentName ? <span aria-hidden="true">·</span> : null}
            <SourceAbbreviations
              source={race.source}
              variantSources={race.variantSources}
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
      columns={dndRaceColumns}
      data={races}
      getRowId={getRaceRowId}
      initialSorting={GROUPED_SORT}
      lockedSorting={GROUPED_SORT}
      enableMultiSort={false}
      initialColumnVisibility={{ groupSort: false }}
      onRowClick={onRowClick}
      emptyMessage="No races found with those filters."
      pageSize={25}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
