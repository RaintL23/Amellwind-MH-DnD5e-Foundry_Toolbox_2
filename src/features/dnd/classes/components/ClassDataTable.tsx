import { useCallback } from "react";
import type { Class } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import {
  CompendiumMobileCard,
  formatVariantSources,
} from "@/shared/components/CompendiumMobileCard";
import { getCasterLabel } from "../mappers/class.mapper";
import { classColumns } from "./class-columns";

export {
  DEFAULT_EXCLUDED_SOURCES,
  defaultSelectedSources,
} from "./table/class-table.constants";

interface ClassDataTableProps {
  classes: Class[];
  onRowClick: (cls: Class) => void;
}

function getClassRowId(row: Class): string {
  return row.id;
}

export function ClassDataTable({ classes, onRowClick }: ClassDataTableProps) {
  const renderMobileRow = useCallback(
    (cls: Class) => (
      <CompendiumMobileCard
        title={cls.name}
        onSelect={() => onRowClick(cls)}
        primary={
          <>
            <span>{cls.hitDie}</span>
            <span aria-hidden="true">·</span>
            <span>{getCasterLabel(cls.casterProgression)}</span>
          </>
        }
        secondary={
          <>
            <span>
              {cls.subclasses.length} subclass
              {cls.subclasses.length === 1 ? "" : "es"}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatVariantSources(cls.source, cls.variantSources)}</span>
          </>
        }
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={classColumns}
      data={classes}
      getRowId={getClassRowId}
      onRowClick={onRowClick}
      emptyMessage="No classes found with those filters."
      pageSize={25}
      initialColumnVisibility={{ edition: false }}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
