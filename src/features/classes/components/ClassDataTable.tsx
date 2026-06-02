import { useMemo } from "react";
import { Class } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { classColumns, classGlobalFilter } from "./class-columns";
import { defaultSelectedSources } from "./table/class-table.constants";
import { ClassDataTableToolbar } from "./table/ClassDataTableToolbar";

export {
  DEFAULT_EXCLUDED_SOURCES,
  defaultSelectedSources,
} from "./table/class-table.constants";

interface ClassDataTableProps {
  classes: Class[];
  sourceOptions: string[];
  onRowClick: (cls: Class) => void;
}

export function ClassDataTable({
  classes,
  sourceOptions,
  onRowClick,
}: ClassDataTableProps) {
  const initialSourceFilter = useMemo(
    () => defaultSelectedSources(sourceOptions),
    [sourceOptions],
  );

  const initialColumnFilters = useMemo(
    () => [{ id: "source", value: initialSourceFilter }],
    [initialSourceFilter],
  );

  return (
    <DataTable
      columns={classColumns}
      data={classes}
      onRowClick={onRowClick}
      emptyMessage="No classes found with those filters."
      pageSize={25}
      globalFilterFn={classGlobalFilter}
      initialColumnVisibility={{ edition: false }}
      initialColumnFilters={initialColumnFilters}
      toolbar={(table) => (
        <ClassDataTableToolbar table={table} sourceOptions={sourceOptions} />
      )}
    />
  );
}
